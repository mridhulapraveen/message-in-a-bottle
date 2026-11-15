import { NextRequest, NextResponse } from "next/server";

import { frameGroupId, frameOwnerId, frameTokenOk, localNow, openFrameDb, tokenFrom } from "@/lib/frame";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMINDER_HOUR = 15;

function caption(kind: string) {
  if (kind === "photo") return "Sent a picture.";
  if (kind === "audio") return "Sent a voice note.";
  return "Sent a video.";
}

export async function GET(req: NextRequest) {
  if (!frameTokenOk(tokenFrom(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ownerId = frameOwnerId();
  const { date, hour } = localNow();
  const noStore = { headers: { "Cache-Control": "no-store" } };

  const db = openFrameDb();
  try {
    const groupId = frameGroupId(db, ownerId, date);
    // EDIT: prompts live in daily_prompts (group_id, day, prompt), one row per journal per day.
    const prompt = groupId
      ? (db.prepare("SELECT group_id AS id, prompt AS text FROM daily_prompts WHERE group_id = ? AND day = ?").get(groupId, date) as
          | { id: number; text: string }
          | undefined)
      : undefined;
    // EDIT: users.name is users.username. The frame lists the crew of this journal, not every account.
    const users = groupId
      ? (db
          .prepare(
            `SELECT u.id, u.username AS name
             FROM users u
             JOIN memberships m ON m.user_id = u.id
             WHERE m.group_id = ?
             ORDER BY u.id`,
          )
          .all(groupId) as { id: number; name: string }[])
      : [];
    // EDIT: entries have no text body. An answer is a media file (kind + filename) for that journal and day.
    const entries = groupId
      ? (db
          .prepare(
            "SELECT user_id, kind, filename FROM entries WHERE group_id = ? AND day = ? ORDER BY id",
          )
          .all(groupId, date) as { user_id: number; kind: string; filename: string }[])
      : [];

    const answered = new Set(entries.map((entry) => entry.user_id));
    const ownerDone = answered.has(ownerId);
    const state = ownerDone ? "unlocked" : hour >= REMINDER_HOUR ? "reminder" : "locked";
    const names = new Map(users.map((user) => [user.id, user.name]));
    const token = tokenFrom(req);
    const others = entries.filter((entry) => entry.user_id !== ownerId);
    const describe = (entry: { user_id: number; kind: string; filename: string }) => ({
      id: entry.filename,
      name: names.get(entry.user_id) ?? "Someone",
      body: caption(entry.kind),
      kind: entry.kind,
    });

    return NextResponse.json(
      {
        state,
        prompt: prompt?.text ?? "No prompt today",
        answered: answered.size,
        total: users.length,
        members: users.map((user) => ({
          name: user.name,
          answered: answered.has(user.id),
          you: user.id === ownerId,
        })),
        messages: ownerDone
          ? others.map((entry) => ({
              ...describe(entry),
              src: `/api/device/media?t=${encodeURIComponent(token)}&file=${encodeURIComponent(entry.filename)}`,
            }))
          : [],
        waiting: ownerDone ? [] : others.map(describe),
      },
      noStore,
    );
  } finally {
    db.close();
  }
}
