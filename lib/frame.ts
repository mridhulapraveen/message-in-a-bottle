import { timingSafeEqual } from "node:crypto";

import Database from "better-sqlite3";
import type { NextRequest } from "next/server";

export const FRAME_TZ = process.env.FRAME_TZ ?? "America/New_York";

export function frameTokenOk(given: string) {
  const want = process.env.FRAME_TOKEN ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return want.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export function tokenFrom(req: NextRequest) {
  return (
    req.nextUrl.searchParams.get("t") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  );
}

export function localNow() {
  const now = new Date();
  const date = now.toLocaleDateString("en-CA", { timeZone: FRAME_TZ });
  const hour =
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: FRAME_TZ,
        hour: "numeric",
        hour12: false,
      }).format(now),
    ) % 24;
  return { date, hour };
}

export function openFrameDb() {
  return new Database(process.env.DB_PATH ?? "./journal.db", {
    readonly: true,
    fileMustExist: true,
  });
}

export function frameOwnerId() {
  return Number(process.env.FRAME_USER_ID);
}

export function frameGroupId(db: Database.Database, ownerId: number, date: string) {
  const forced = Number(process.env.FRAME_GROUP_ID);
  if (Number.isFinite(forced) && forced > 0) {
    const member = db.prepare("SELECT 1 FROM memberships WHERE user_id = ? AND group_id = ?").get(ownerId, forced);
    if (member) return forced;
  }
  const row = db
    .prepare(
      `SELECT g.id AS id
       FROM groups g
       JOIN memberships m ON m.group_id = g.id
       WHERE m.user_id = ?
       ORDER BY (
         SELECT COUNT(*) FROM entries e WHERE e.group_id = g.id AND e.day = ?
       ) DESC,
       (
         SELECT COUNT(*) FROM daily_prompts p WHERE p.group_id = g.id AND p.day = ?
       ) DESC,
       g.id
       LIMIT 1`,
    )
    .get(ownerId, date, date) as { id: number } | undefined;
  return row?.id;
}
