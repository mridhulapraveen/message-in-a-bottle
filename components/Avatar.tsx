export const AVATAR_IDS = [
  "seahorse",
  "boxjelly",
  "divercat",
  "jelly",
  "fish",
  "shark",
  "squid",
  "crab",
  "star",
  "shrimp",
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

const LABELS: Record<AvatarId, string> = {
  seahorse: "Seahorse",
  boxjelly: "Box jellyfish",
  divercat: "Cat in a diving helmet",
  jelly: "Jellyfish",
  fish: "Fish",
  shark: "Whale shark",
  squid: "Squid",
  crab: "Crab",
  star: "Starfish",
  shrimp: "Shrimp",
};

export function isAvatarId(value: string): value is AvatarId {
  return (AVATAR_IDS as readonly string[]).includes(value);
}

export function Avatar({ id, className }: { id?: string | null; className?: string }) {
  if (!id || !isAvatarId(id)) return null;
  return (
    <span className={className ?? "avatar"}>
      <img src={`/avatars/${id}.png?v=2`} alt={LABELS[id]} />
    </span>
  );
}
