import { logout } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { SeaShell } from "@/components/SeaShell";
import { ShipWheelIcon } from "@/components/ui/Icons";

export function PlankHeader({ user }: { user: { username: string; avatar: string | null } | null }) {
  return (
    <header className="plank-bar">
      <a className="brand" href="/">
        <ShipWheelIcon className="brand-mark" title="Ship wheel" />
        <span>Friends in a Bottle</span>
      </a>
      <SeaShell />
      {user ? (
        <span className="who">
          <Avatar id={user.avatar} />
          <span>{user.username}</span>
          <form action={logout}>
            <button type="submit">Log out</button>
          </form>
        </span>
      ) : null}
    </header>
  );
}
