import { headers } from "next/headers";

import { addComment, setPrompt } from "@/app/actions";
import { DeleteMessage } from "@/components/DeleteMessage";
import { Avatar } from "@/components/Avatar";
import { LocalTime } from "@/components/LocalTime";
import { OldMemories, type Memory } from "@/components/OldMemories";
import { Recorder } from "@/components/Recorder";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { currentUser } from "@/lib/auth";
import { getDb, groupForMember, todayStr, type Comment, type Entry, type PromptRow } from "@/lib/db";
import { go } from "@/lib/notice";

export const dynamic = "force-dynamic";

const MAX_SECONDS = 180;

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  const groupId = Number(id);
  const user = await currentUser();
  if (!user) go(`/?next=${encodeURIComponent(`/group/${id}`)}`, "Please sign in to continue.");

  const db = getDb();
  const access = groupForMember(db, user.id, groupId);
  if ("error" in access) {
    go("/", access.error === "missing" ? "That journal doesn't exist." : "You don't belong to that journal.");
  }
  const group = access.group;

  const prompt = db
    .prepare("SELECT * FROM daily_prompts WHERE group_id = ? AND day = ?")
    .get(groupId, todayStr()) as PromptRow | undefined;
  const entries = db
    .prepare(
      `SELECT e.*, u.username, u.avatar FROM entries e
       JOIN users u ON u.id = e.user_id
       WHERE e.group_id = ? AND e.day = ? ORDER BY e.id DESC`,
    )
    .all(groupId, todayStr()) as Entry[];
  const comments = db
    .prepare(
      `SELECT c.*, u.username, u.avatar FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN entries e ON e.id = c.entry_id
       WHERE e.group_id = ? AND e.day = ?
       ORDER BY c.id`,
    )
    .all(groupId, todayStr()) as Comment[];
  const members = db
    .prepare(
      `SELECT u.username, u.avatar FROM users u
       JOIN memberships m ON m.user_id = u.id
       WHERE m.group_id = ? ORDER BY u.username`,
    )
    .all(groupId) as { username: string; avatar: string | null }[];

  const pastEntries = db
    .prepare(
      `SELECT e.id, e.day, e.kind, e.filename, u.username, p.prompt
       FROM entries e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN daily_prompts p ON p.group_id = e.group_id AND p.day = e.day
       WHERE e.group_id = ? AND e.day < ?
       ORDER BY e.day DESC, e.id DESC`,
    )
    .all(groupId, todayStr()) as unknown as {
      id: number;
      day: string;
      kind: string;
      filename: string;
      username: string;
      prompt: string | null;
    }[];
  const pastComments = db
    .prepare(
      `SELECT c.id, c.entry_id, c.body, c.filename, u.username, u.avatar
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN entries e ON e.id = c.entry_id
       WHERE e.group_id = ? AND e.day < ?
       ORDER BY c.id`,
    )
    .all(groupId, todayStr()) as unknown as {
      id: number;
      entry_id: number;
      body: string | null;
      filename: string | null;
      username: string;
      avatar: string | null;
    }[];
  const commentsByEntry = new Map<number, Memory["comments"]>();
  for (const comment of pastComments) {
    const list = commentsByEntry.get(comment.entry_id) ?? [];
    list.push({
      id: comment.id,
      username: comment.username,
      avatar: comment.avatar,
      body: comment.body,
      filename: comment.filename,
    });
    commentsByEntry.set(comment.entry_id, list);
  }
  const memories: Memory[] = pastEntries.map((memory) => ({
    id: memory.id,
    day: memory.day,
    kind: memory.kind,
    filename: memory.filename,
    username: memory.username,
    prompt: memory.prompt,
    comments: commentsByEntry.get(memory.id) ?? [],
  }));

  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto")?.split(",")[0].trim() || "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const shareLink = `${proto}://${host}/join/${group.code}`;

  return (
    <>
      {notice ? <div className="flash">{notice}</div> : null}
      <p>
        <a className="back" href="/">
          ← Back to the shore
        </a>
      </p>
      <h1>{group.name}</h1>
      {prompt ? (
        <>
          <Panel>
            <small>Today&apos;s message in a bottle</small>
            <p className="prompt">{prompt.prompt}</p>
          </Panel>
          <Recorder groupId={group.id} maxSeconds={MAX_SECONDS} />
        </>
      ) : (
        <Panel>
          <h2>You&apos;re first at the shore today!</h2>
          <p>Pick the message everyone will answer.</p>
          <form action={setPrompt}>
            <input type="hidden" name="group_id" value={group.id} />
            <input type="hidden" name="mode" value="random" />
            <Button type="submit">Pull a random prompt from the sea</Button>
          </form>
          <p>or write your own:</p>
          <form action={setPrompt}>
            <input type="hidden" name="group_id" value={group.id} />
            <input type="hidden" name="mode" value="custom" />
            <TextArea name="prompt" rows={2} maxLength={200} placeholder="Write your message..." required />
            <Button className="sea" type="submit">
              Seal the bottle
            </Button>
          </form>
        </Panel>
      )}

      <h2 className="shore">Messages washed ashore</h2>
      {entries.length === 0 ? <p className="empty">Nothing has washed ashore yet today.</p> : null}
      {entries.map((entry) => (
        <Panel key={entry.id}>
          <div className="meta">
            <Avatar id={entry.avatar} />
            <Tag>{entry.username}</Tag>
            {entry.created_at ? (
              <small>
                <LocalTime iso={entry.created_at} />
              </small>
            ) : null}
          </div>
          {entry.kind === "video" ? (
            <video controls playsInline src={`/uploads/${entry.filename}`} />
          ) : entry.kind === "photo" ? (
            <img className="photo" src={`/uploads/${entry.filename}`} alt={`${entry.username}'s picture`} />
          ) : (
            <audio controls src={`/uploads/${entry.filename}`} />
          )}
          {entry.user_id === user.id ? <DeleteMessage entryId={entry.id} /> : null}
          <div className="comments">
            <h3>Comments</h3>
            {comments
              .filter((comment) => comment.entry_id === entry.id)
              .map((comment) => (
                <div className="comment" key={comment.id}>
                  <span className="name-row">
                    <Avatar id={comment.avatar} className="avatar avatar-sm" />
                    <Tag>{comment.username}</Tag>
                  </span>
                  {comment.body ? <p>{comment.body}</p> : null}
                  {comment.filename ? (
                    <img
                      className="comment-photo"
                      src={`/uploads/${comment.filename}`}
                      alt={`${comment.username}'s comment picture`}
                    />
                  ) : null}
                </div>
              ))}
            <form action={addComment} className="comment-form">
              <input type="hidden" name="entry_id" value={entry.id} />
              <Input type="text" name="body" placeholder="Add a comment" maxLength={300} />
              <label className="comment-file">
                Picture
                <input type="file" name="picture" accept="image/png,image/jpeg,image/webp,image/gif" />
              </label>
              <Button className="sea" type="submit">
                Reply
              </Button>
            </form>
          </div>
        </Panel>
      ))}

      <Panel>
        <h2>Invite your crew</h2>
        <p>
          Share this code. Friends tap <strong>Add journal</strong> on their home page and enter it:
        </p>
        <div className="code">{group.code}</div>
        <p>
          <small className="share-link">Or send this link: {shareLink}</small>
        </p>
        <p className="members">
          <small>Crew:</small>
          {members.map((member) => (
            <span className="name-row" key={member.username}>
              <Avatar id={member.avatar} className="avatar avatar-sm" />
              {member.username}
            </span>
          ))}
        </p>
      </Panel>
      <OldMemories memories={memories} />
    </>
  );
}
