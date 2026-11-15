"use client";

import { useState } from "react";

type Gem = {
  id: string;
  dx: number;
  dy: number;
  kind: "coin" | "ruby" | "sapphire" | "emerald";
  delay: number;
};

const GEMS: Gem["kind"][] = ["coin", "coin", "coin", "ruby", "sapphire", "emerald", "coin", "ruby"];

export function TreasureChest({ children, startOpen = false }: { children: React.ReactNode; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [gems, setGems] = useState<Gem[]>([]);

  function openChest() {
    const batch = Date.now();
    setGems(
      GEMS.map((kind, index) => ({
        id: `${batch}-${index}`,
        kind,
        dx: -90 + Math.random() * 180,
        dy: -70 - Math.random() * 80,
        delay: Math.random() * 0.12,
      })),
    );
    setOpen(true);
    window.setTimeout(() => setGems([]), 1400);
  }

  return (
    <div className="treasure">
      <div className="chest-stage">
        {open ? (
          <div className="chest open" aria-hidden="true">
            <ChestArt open />
          </div>
        ) : (
          <button type="button" className="chest" onClick={openChest}>
            <ChestArt open={false} />
            <span>Open the treasure chest</span>
          </button>
        )}
        <div className="spew" aria-hidden="true">
          {gems.map((gem) => (
            <span
              key={gem.id}
              className={`gem ${gem.kind}`}
              style={{
                ["--dx" as string]: `${gem.dx}px`,
                ["--dy" as string]: `${gem.dy}px`,
                animationDelay: `${gem.delay}s`,
              }}
            />
          ))}
        </div>
      </div>
      {open ? <div className="treasure-loot">{children}</div> : null}
    </div>
  );
}

function ChestArt({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 180 120" aria-hidden="true">
      <path d="M22 52 H158 V108 H22 Z" fill="#7a4a22" />
      <path d="M22 52 H158 V64 H22 Z" fill="#e8c56a" />
      <path d="M22 96 H158 V108 H22 Z" fill="#e8c56a" />
      <path d="M22 52 V108" stroke="#f8e7a8" strokeWidth="6" />
      <path d="M158 52 V108" stroke="#f8e7a8" strokeWidth="6" />
      <circle cx="46" cy="80" r="6" fill="#d94b6a" stroke="#f8e7a8" strokeWidth="2" />
      <circle cx="134" cy="80" r="6" fill="#3d7edb" stroke="#f8e7a8" strokeWidth="2" />
      <rect x="78" y="68" width="24" height="20" rx="4" fill="#f8e7a8" />
      <circle cx="90" cy="76" r="3" fill="#5c3a1e" />
      {open ? (
        <path d="M28 34 C28 8 152 8 152 34 L142 52 H38 Z" fill="#c4894a" stroke="#f8e7a8" strokeWidth="4" />
      ) : (
        <path d="M22 52 C22 22 158 22 158 52 Z" fill="#c4894a" stroke="#f8e7a8" strokeWidth="4" />
      )}
      <path d="M70 28 H110" stroke="#d94b6a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
