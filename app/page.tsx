import { addJournal, login, newGroup, setAvatar, signup } from "@/app/actions";
import { AVATAR_IDS, Avatar } from "@/components/Avatar";
import { Lobster } from "@/components/Lobster";
import { TreasureChest } from "@/components/TreasureChest";
import { Button } from "@/components/ui/Button";
import { BottleIcon } from "@/components/ui/Icons";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { currentUser, safeNext } from "@/lib/auth";
import { getDb, type Group } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; next?: string }>;
}) {
  const { notice, next } = await searchParams;
  const nextPath = safeNext(next ?? null, "");
  const user = await currentUser();
  const groups = user
    ? (getDb()
        .prepare(
          `SELECT g.* FROM groups g
           JOIN memberships m ON m.group_id = g.id
           WHERE m.user_id = ? ORDER BY g.name`,
        )
        .all(user.id) as Group[])
    : [];

  return (
    <>
      {notice ? <div className="flash">{notice}</div> : null}
      {!user ? (
        <>
          <Lobster className="hero-lobster" label="A lobster holding a message in a bottle" />
          <h1 className="center">Send a message across the sea</h1>
          <p className="lead center">
            Answer a short daily prompt with a video, a voice note, or a picture, and stay close to your crew.
          </p>
          <TreasureChest startOpen={Boolean(notice)}>
            <Panel>
              <h2>Welcome back, sailor</h2>
              <form action={login}>
                {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
                <Input type="text" name="username" placeholder="Username" required autoComplete="username" />
                <Input type="password" name="password" placeholder="Password" required autoComplete="current-password" />
                <Button className="sea" type="submit">
                  Set sail
                </Button>
              </form>
            </Panel>
            <Panel>
              <h2>New to the ship? Sign the crew roster</h2>
              <form action={signup}>
                {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
                <Input type="text" name="username" placeholder="Choose a username" required autoComplete="username" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Choose a password (6+ characters)"
                  required
                  autoComplete="new-password"
                />
                <Input type="password" name="confirm" placeholder="Confirm password" required autoComplete="new-password" />
                <Button type="submit">Create account</Button>
              </form>
            </Panel>
          </TreasureChest>
        </>
      ) : (
        <>
          <h1>Your bottles</h1>
          <p className="lead">Each journal is a bottle you and your friends keep filling.</p>
          <details className="profile-picker">
            <summary>choose your messenger</summary>
            <div className="avatar-grid">
              {AVATAR_IDS.map((avatarId) => (
                <form action={setAvatar} key={avatarId}>
                  <input type="hidden" name="avatar" value={avatarId} />
                  <button type="submit" className={user.avatar === avatarId ? "picked" : undefined} aria-label={avatarId}>
                    <Avatar id={avatarId} />
                  </button>
                </form>
              ))}
            </div>
          </details>
          {groups.length === 0 ? (
            <Panel>
              <p>The sea is empty! Cast a new bottle, or add one with a code from a friend.</p>
            </Panel>
          ) : (
            <div className="journal-shelf">
              {groups.map((group) => (
                <a className="journal-cover" href={`/group/${group.id}`} key={group.id}>
                  <BottleIcon />
                  <span>{group.name}</span>
                </a>
              ))}
            </div>
          )}
          <details>
            <summary className="btn">New journal</summary>
            <form action={newGroup} className="card">
              <h2>Cast a new bottle</h2>
              <Input type="text" name="group_name" placeholder="Journal name" maxLength={60} required />
              <Button type="submit">Create journal</Button>
            </form>
          </details>
          <details>
            <summary className="btn sea">Add journal</summary>
            <form action={addJournal} className="card">
              <h2>Found a bottle?</h2>
              <Input type="text" name="code" placeholder="Enter journal code" maxLength={10} required autoComplete="off" />
              <Button className="sea" type="submit">
                Join
              </Button>
            </form>
          </details>
        </>
      )}
    </>
  );
}
