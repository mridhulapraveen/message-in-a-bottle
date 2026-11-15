import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

import { NextRequest } from "next/server";

import { frameGroupId, frameOwnerId, frameTokenOk, localNow, openFrameDb, tokenFrom } from "@/lib/frame";
import { uploadDir } from "@/lib/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE_RE = /^[a-f0-9]{32}\.(webm|mp4|ogg|jpg|jpeg|png|gif|webp)$/;

function contentType(filename: string) {
  if (filename.endsWith(".mp4")) return "video/mp4";
  if (filename.endsWith(".ogg")) return "audio/ogg";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".gif")) return "image/gif";
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return "video/webm";
}

export async function GET(req: NextRequest) {
  if (!frameTokenOk(tokenFrom(req))) return new Response("unauthorized", { status: 401 });

  const filename = req.nextUrl.searchParams.get("file") ?? "";
  if (!FILE_RE.test(filename)) return new Response("Not found", { status: 404 });

  const ownerId = frameOwnerId();
  const { date } = localNow();
  const db = openFrameDb();
  try {
    const groupId = frameGroupId(db, ownerId, date);
    if (!groupId) return new Response("Not found", { status: 404 });
    const ownerAnswer = db
      .prepare("SELECT 1 FROM entries WHERE group_id = ? AND day = ? AND user_id = ?")
      .get(groupId, date, ownerId);
    if (!ownerAnswer) return new Response("Not found", { status: 404 });
    const entry = db
      .prepare(
        "SELECT 1 FROM entries WHERE group_id = ? AND day = ? AND filename = ? AND user_id != ?",
      )
      .get(groupId, date, filename, ownerId);
    if (!entry) return new Response("Not found", { status: 404 });
  } finally {
    db.close();
  }

  const filePath = path.join(uploadDir(), filename);
  const info = await stat(filePath).catch(() => null);
  if (!info) return new Response("Not found", { status: 404 });

  const type = contentType(filename);
  const range = req.headers.get("range");
  const match = range ? /bytes=(\d+)-(\d*)/.exec(range) : null;
  if (match) {
    const start = Number(match[1]);
    const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
    const stream = createReadStream(filePath, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${info.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  const stream = createReadStream(filePath);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
