import { currentUser } from "@/lib/auth";
import { getDb, type Group } from "@/lib/db";
import { go } from "@/lib/notice";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = decodeURIComponent(code).trim().toUpperCase();
  const user = await currentUser();
  if (!user) {
    go(
      `/?next=${encodeURIComponent(`/join/${normalized}`)}`,
      "Sign in or create an account to join this journal.",
    );
  }

  const db = getDb();
  const group = db.prepare("SELECT * FROM groups WHERE code = ?").get(normalized) as Group | undefined;
  if (!group) go("/", "That code doesn't match any journal.");
  db.prepare("INSERT OR IGNORE INTO memberships (user_id, group_id) VALUES (?, ?)").run(user.id, group.id);
  go(`/group/${group.id}`, `You joined ${group.name}!`);
}
