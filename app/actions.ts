"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { clearSession, currentUser, hashPassword, safeNext, setSession, verifyPassword } from "@/lib/auth";
import { isAvatarId } from "@/components/Avatar";
import { getDb, groupForMember, isUniqueError, makeCode, todayStr, type User } from "@/lib/db";
import { go } from "@/lib/notice";
import { randomPrompt } from "@/lib/prompts";

const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/;

export async function signup(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = safeNext(formData.get("next"));

  if (!USERNAME_RE.test(username)) {
    go("/", "Usernames must be 3-30 characters: letters, numbers, or underscores.");
  }
  if (password.length < 6) {
    go("/", "Your password must be at least 6 characters.");
  }
  if (password !== confirm) {
    go("/", "Passwords didn't match.");
  }

  try {
    const result = getDb()
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run(username, await hashPassword(password));
    await setSession(Number(result.lastInsertRowid));
  } catch (err) {
    if (isUniqueError(err)) {
      go("/", "That username is already taken. Please choose another one.");
    }
    throw err;
  }
  redirect(next);
}

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const row = getDb().prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    go("/", "Wrong username or password.");
  }
  await setSession(row.id);
  redirect(next);
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function setAvatar(formData: FormData) {
  const user = await currentUser();
  if (!user) go("/", "Please sign in to continue.");
  const avatar = String(formData.get("avatar") ?? "");
  if (!isAvatarId(avatar)) go("/", "Pick one of the profile pictures.");
  getDb().prepare("UPDATE users SET avatar = ? WHERE id = ?").run(avatar, user.id);
  redirect("/");
}

export async function newGroup(formData: FormData) {
  const user = await currentUser();
  if (!user) go("/", "Please sign in to continue.");
  const name = String(formData.get("group_name") ?? "").trim().slice(0, 60);
  if (!name) go("/", "Give your journal a name.");
  const db = getDb();
  const code = makeCode(db);
  const result = db.prepare("INSERT INTO groups (name, code) VALUES (?, ?)").run(name, code);
  const groupId = Number(result.lastInsertRowid);
  db.prepare("INSERT INTO memberships (user_id, group_id) VALUES (?, ?)").run(user.id, groupId);
  go(`/group/${groupId}`, "Journal created! Share its code with your friends.");
}

export async function addJournal(formData: FormData) {
  const user = await currentUser();
  if (!user) go("/", "Please sign in to continue.");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const db = getDb();
  const grp = db.prepare("SELECT * FROM groups WHERE code = ?").get(code) as
    | { id: number; name: string }
    | undefined;
  if (!grp) {
    go("/", "That code doesn't match any journal. Double-check it and try again.");
  }
  db.prepare("INSERT OR IGNORE INTO memberships (user_id, group_id) VALUES (?, ?)").run(user.id, grp.id);
  go(`/group/${grp.id}`, `You joined ${grp.name}!`);
}

export async function setPrompt(formData: FormData) {
  const user = await currentUser();
  if (!user) go("/", "Please sign in to continue.");
  const groupId = Number(formData.get("group_id"));
  const mode = String(formData.get("mode") ?? "");
  const text = (mode === "random" ? randomPrompt() : String(formData.get("prompt") ?? "").trim()).slice(0, 200);
  if (!text) go(`/group/${groupId}`, "Type a prompt first.");

  const db = getDb();
  const access = groupForMember(db, user.id, groupId);
  if ("error" in access) {
    go("/", access.error === "missing" ? "That journal doesn't exist." : "You don't belong to that journal.");
  }

  try {
    db.prepare(
      "INSERT INTO daily_prompts (group_id, day, prompt, set_by) VALUES (?, ?, ?, ?)",
    ).run(groupId, todayStr(), text, user.id);
  } catch (err) {
    if (isUniqueError(err)) {
      go(`/group/${groupId}`, "Someone in your journal already picked today's prompt.");
    }
    throw err;
  }
  redirect(`/group/${groupId}`);
}

export async function deleteEntry(formData: FormData) {
  const user = await currentUser();
  if (!user) go("/", "Please sign in to continue.");
  const entryId = Number(formData.get("entry_id"));
  const db = getDb();
  const row = db.prepare("SELECT * FROM entries WHERE id = ?").get(entryId) as
    | { id: number; user_id: number; group_id: number; filename: string }
    | undefined;
  if (!row) go("/", "That message is already gone.");
  if (row.user_id !== user.id) go(`/group/${row.group_id}`, "You can only delete your own messages.");
  const commentFiles = db
    .prepare("SELECT filename FROM comments WHERE entry_id = ? AND filename IS NOT NULL")
    .all(entryId) as { filename: string }[];
  db.prepare("DELETE FROM comments WHERE entry_id = ?").run(entryId);
  db.prepare("DELETE FROM entries WHERE id = ?").run(entryId);
  const { unlink } = await import("fs/promises");
  const { uploadDir } = await import("@/lib/paths");
  const path = await import("path");
  const folder = uploadDir();
  await unlink(path.join(folder, row.filename)).catch(() => undefined);
  await Promise.all(commentFiles.map((file) => unlink(path.join(folder, file.filename)).catch(() => undefined)));
  redirect(`/group/${row.group_id}`);
}

export async function addComment(formData: FormData) {
  const user = await currentUser();
  if (!user) go("/", "Please sign in to continue.");
  const entryId = Number(formData.get("entry_id"));
  const body = String(formData.get("body") ?? "").trim().slice(0, 300);
  const picture = formData.get("picture");
  const db = getDb();
  const entry = db.prepare("SELECT id, group_id FROM entries WHERE id = ?").get(entryId) as
    | { id: number; group_id: number }
    | undefined;
  if (!entry) go("/", "That message is already gone.");
  const access = groupForMember(db, user.id, entry.group_id);
  if ("error" in access) {
    go("/", access.error === "missing" ? "That journal doesn't exist." : "You don't belong to that journal.");
  }

  let filename: string | null = null;
  if (picture instanceof File && picture.size > 0) {
    if (!picture.type.toLowerCase().startsWith("image/")) {
      go(`/group/${entry.group_id}`, "Comment pictures need to be an image.");
    }
    if (picture.size > 8 * 1024 * 1024) {
      go(`/group/${entry.group_id}`, "That picture is over 8 MB.");
    }
    const mime = picture.type.toLowerCase();
    const ext = mime.includes("png") ? "png" : mime.includes("gif") ? "gif" : mime.includes("webp") ? "webp" : "jpg";
    filename = `${randomUUID().replace(/-/g, "")}.${ext}`;
    const { writeFile } = await import("fs/promises");
    const { uploadDir } = await import("@/lib/paths");
    const path = await import("path");
    await writeFile(path.join(uploadDir(), filename), Buffer.from(await picture.arrayBuffer()));
  }
  if (!body && !filename) go(`/group/${entry.group_id}`, "Write a comment or add a picture.");

  db.prepare(
    "INSERT INTO comments (entry_id, user_id, body, filename, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(entryId, user.id, body || null, filename, new Date().toISOString());
  redirect(`/group/${entry.group_id}`);
}
