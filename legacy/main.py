import os
import re
import secrets
import sqlite3
from datetime import date, datetime, timezone
from functools import wraps
from uuid import uuid4

from flask import (
    Flask, abort, flash, redirect, render_template, request,
    send_from_directory, session, url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

from prompts import random_prompt

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")
app.config["MAX_CONTENT_LENGTH"] = 300 * 1024 * 1024  # 300 MB per upload

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
DB_PATH = os.path.join(BASE_DIR, "journal.db")
MAX_SECONDS = 180  # 3 minutes (enforced in the browser, see group.html)
CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no confusing 0/O/1/I
USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS memberships (
                user_id INTEGER NOT NULL,
                group_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, group_id)
            );
            CREATE TABLE IF NOT EXISTS daily_prompts (
                group_id INTEGER NOT NULL,
                day TEXT NOT NULL,
                prompt TEXT NOT NULL,
                set_by INTEGER NOT NULL,
                PRIMARY KEY (group_id, day)
            );
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                day TEXT NOT NULL,
                kind TEXT NOT NULL,
                filename TEXT NOT NULL,
                created_at TEXT
            );
            """
        )


def current_user():
    uid = session.get("user_id")
    if uid is None:
        return None
    with get_db() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()


@app.context_processor
def inject_user():
    return {"user": current_user()}


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if current_user() is None:
            session.pop("user_id", None)
            session["next"] = request.url
            flash("Please sign in to continue.")
            return redirect(url_for("home"))
        return view(*args, **kwargs)
    return wrapper


def get_group_for_member(conn, group_id):
    """Return the journal if the logged-in user belongs to it, else 403/404."""
    grp = conn.execute("SELECT * FROM groups WHERE id = ?", (group_id,)).fetchone()
    if grp is None:
        abort(404)
    member = conn.execute(
        "SELECT 1 FROM memberships WHERE user_id = ? AND group_id = ?",
        (session["user_id"], group_id),
    ).fetchone()
    if member is None:
        abort(403)
    return grp


def today_str():
    return date.today().isoformat()


def make_code(conn):
    """Generate a unique 6-character join code."""
    while True:
        code = "".join(secrets.choice(CODE_CHARS) for _ in range(6))
        if conn.execute("SELECT 1 FROM groups WHERE code = ?", (code,)).fetchone() is None:
            return code


@app.route("/")
def home():
    user = current_user()
    groups = []
    if user:
        with get_db() as conn:
            groups = conn.execute(
                """SELECT g.* FROM groups g
                   JOIN memberships m ON m.group_id = g.id
                   WHERE m.user_id = ? ORDER BY g.name""",
                (user["id"],),
            ).fetchall()
    return render_template("home.html", groups=groups)


@app.route("/signup", methods=["POST"])
def signup():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    confirm = request.form.get("confirm", "")

    if not USERNAME_RE.match(username):
        flash("Usernames must be 3-30 characters: letters, numbers, or underscores.")
        return redirect(url_for("home"))
    if len(password) < 6:
        flash("Your password must be at least 6 characters.")
        return redirect(url_for("home"))
    if password != confirm:
        flash("Passwords didn't match.")
        return redirect(url_for("home"))

    try:
        with get_db() as conn:
            cur = conn.execute(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                (username, generate_password_hash(password)),
            )
            user_id = cur.lastrowid
    except sqlite3.IntegrityError:
        flash("That username is already taken. Please choose another one.")
        return redirect(url_for("home"))

    session["user_id"] = user_id
    return redirect(session.pop("next", None) or url_for("home"))


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()
    if row is None or not check_password_hash(row["password_hash"], password):
        flash("Wrong username or password.")
        return redirect(url_for("home"))

    session["user_id"] = row["id"]
    return redirect(session.pop("next", None) or url_for("home"))


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))


@app.route("/groups/new", methods=["POST"])
@login_required
def new_group():
    name = request.form.get("group_name", "").strip()[:60]
    if not name:
        flash("Give your journal a name.")
        return redirect(url_for("home"))
    with get_db() as conn:
        code = make_code(conn)
        cur = conn.execute(
            "INSERT INTO groups (name, code) VALUES (?, ?)", (name, code)
        )
        group_id = cur.lastrowid
        conn.execute(
            "INSERT INTO memberships (user_id, group_id) VALUES (?, ?)",
            (session["user_id"], group_id),
        )
    flash("Journal created! Share its code with your friends.")
    return redirect(url_for("group", group_id=group_id))


@app.route("/groups/add", methods=["POST"])
@login_required
def add_journal():
    code = request.form.get("code", "").strip().upper()
    with get_db() as conn:
        grp = conn.execute("SELECT * FROM groups WHERE code = ?", (code,)).fetchone()
        if grp is None:
            flash("That code doesn't match any journal. Double-check it and try again.")
            return redirect(url_for("home"))
        conn.execute(
            "INSERT OR IGNORE INTO memberships (user_id, group_id) VALUES (?, ?)",
            (session["user_id"], grp["id"]),
        )
    flash(f"You joined {grp['name']}!")
    return redirect(url_for("group", group_id=grp["id"]))


@app.route("/join/<code>")
def join(code):
    """Optional share link: opening it joins the journal (after sign-in)."""
    if current_user() is None:
        session["next"] = request.url
        flash("Sign in or create an account to join this journal.")
        return redirect(url_for("home"))
    code = code.strip().upper()
    with get_db() as conn:
        grp = conn.execute("SELECT * FROM groups WHERE code = ?", (code,)).fetchone()
        if grp is None:
            flash("That code doesn't match any journal.")
            return redirect(url_for("home"))
        conn.execute(
            "INSERT OR IGNORE INTO memberships (user_id, group_id) VALUES (?, ?)",
            (session["user_id"], grp["id"]),
        )
    flash(f"You joined {grp['name']}!")
    return redirect(url_for("group", group_id=grp["id"]))


@app.route("/group/<int:group_id>")
@login_required
def group(group_id):
    with get_db() as conn:
        grp = get_group_for_member(conn, group_id)
        prompt_row = conn.execute(
            "SELECT * FROM daily_prompts WHERE group_id = ? AND day = ?",
            (group_id, today_str()),
        ).fetchone()
        entries = conn.execute(
            """SELECT e.*, u.username FROM entries e
               JOIN users u ON u.id = e.user_id
               WHERE e.group_id = ? AND e.day = ? ORDER BY e.id DESC""",
            (group_id, today_str()),
        ).fetchall()
        members = conn.execute(
            """SELECT u.username FROM users u
               JOIN memberships m ON m.user_id = u.id
               WHERE m.group_id = ? ORDER BY u.username""",
            (group_id,),
        ).fetchall()
    return render_template(
        "group.html",
        group=grp,
        prompt_row=prompt_row,
        entries=entries,
        members=members,
        max_seconds=MAX_SECONDS,
        share_link=url_for("join", code=grp["code"], _external=True),
    )


@app.route("/group/<int:group_id>/prompt", methods=["POST"])
@login_required
def set_prompt(group_id):
    mode = request.form.get("mode")
    text = (
        random_prompt()
        if mode == "random"
        else request.form.get("prompt", "").strip()[:200]
    )
    if not text:
        flash("Type a prompt first.")
        return redirect(url_for("group", group_id=group_id))

    with get_db() as conn:
        get_group_for_member(conn, group_id)
        try:
            conn.execute(
                "INSERT INTO daily_prompts (group_id, day, prompt, set_by) VALUES (?, ?, ?, ?)",
                (group_id, today_str(), text, session["user_id"]),
            )
        except sqlite3.IntegrityError:
            flash("Someone in your journal already picked today's prompt.")
    return redirect(url_for("group", group_id=group_id))


def extension_for(mimetype):
    mime = (mimetype or "").lower()
    if "mp4" in mime or "m4a" in mime:
        return "mp4"
    if "ogg" in mime:
        return "ogg"
    return "webm"


@app.route("/group/<int:group_id>/upload", methods=["POST"])
@login_required
def upload(group_id):
    media = request.files.get("media")
    kind = request.form.get("kind", "audio")
    if media is None or kind not in ("audio", "video"):
        return "Bad request", 400

    with get_db() as conn:
        get_group_for_member(conn, group_id)
        has_prompt = conn.execute(
            "SELECT 1 FROM daily_prompts WHERE group_id = ? AND day = ?",
            (group_id, today_str()),
        ).fetchone()
        if not has_prompt:
            return "Pick a prompt first", 400

        ext = extension_for(media.mimetype)
        filename = f"{uuid4().hex}.{ext}"
        media.save(os.path.join(UPLOAD_DIR, filename))
        conn.execute(
            """INSERT INTO entries (group_id, user_id, day, kind, filename, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (group_id, session["user_id"], today_str(), kind, filename,
             datetime.now(timezone.utc).isoformat()),
        )
    return "OK", 200


@app.route("/uploads/<filename>")
@login_required
def uploaded_file(filename):
    with get_db() as conn:
        row = conn.execute(
            "SELECT group_id FROM entries WHERE filename = ?", (filename,)
        ).fetchone()
        if row is None:
            abort(404)
        get_group_for_member(conn, row["group_id"])
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/delete/<int:entry_id>", methods=["POST"])
@login_required
def delete(entry_id):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM entries WHERE id = ?", (entry_id,)
        ).fetchone()
        if row is None:
            abort(404)
        if row["user_id"] != session["user_id"]:
            abort(403)
        conn.execute("DELETE FROM entries WHERE id = ?", (entry_id,))

    path = os.path.join(UPLOAD_DIR, row["filename"])
    if os.path.exists(path):
        os.remove(path)
    return redirect(url_for("group", group_id=row["group_id"]))


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="127.0.0.1", port=5000)
