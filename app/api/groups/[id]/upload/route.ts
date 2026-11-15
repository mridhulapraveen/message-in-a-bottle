import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";

import { currentUser } from "@/lib/auth";
import { getDb, groupForMember, todayStr } from "@/lib/db";
import { uploadDir } from "@/lib/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 300 * 1024 * 1024;

function extensionFor(mimetype: string, kind: string) {
  const mime = mimetype.toLowerCase();
  if (kind === "photo" || mime.startsWith("image/")) {
    if (mime.includes("png")) return "png";
    if (mime.includes("gif")) return "gif";
    if (mime.includes("webp")) return "webp";
    return "jpg";
  }
  if (mime.includes("mp4") || mime.includes("m4a")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Please sign in to continue.", { status: 401 });

  const groupId = Number((await context.params).id);
  if (!Number.isFinite(groupId)) return new Response("Bad request", { status: 400 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const media = form.get("media");
  const kind = String(form.get("kind") ?? "audio");
  if (!(media instanceof File) || (kind !== "audio" && kind !== "video" && kind !== "photo")) {
    return new Response("Bad request", { status: 400 });
  }
  if (kind === "photo" && !media.type.toLowerCase().startsWith("image/")) {
    return new Response("Choose a picture file", { status: 400 });
  }
  if (media.size > MAX_BYTES) return new Response("File too large", { status: 413 });

  const db = getDb();
  const access = groupForMember(db, user.id, groupId);
  if ("error" in access) {
    return new Response(access.error === "missing" ? "Not found" : "Forbidden", {
      status: access.error === "missing" ? 404 : 403,
    });
  }

  const hasPrompt = db
    .prepare("SELECT 1 FROM daily_prompts WHERE group_id = ? AND day = ?")
    .get(groupId, todayStr());
  if (!hasPrompt) return new Response("Pick a prompt first", { status: 400 });

  const filename = `${randomUUID().replace(/-/g, "")}.${extensionFor(media.type, kind)}`;
  await writeFile(path.join(uploadDir(), filename), Buffer.from(await media.arrayBuffer()));
  db.prepare(
    `INSERT INTO entries (group_id, user_id, day, kind, filename, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(groupId, user.id, todayStr(), kind, filename, new Date().toISOString());

  return new Response("OK");
}
