"use client";

import { useState, type MouseEvent } from "react";

const FISH = [
  { id: "gold", top: "16%", duration: "28s", delay: "0s", color: "#ffb703", flip: false, scale: 1 },
  { id: "blue", top: "28%", duration: "36s", delay: "-12s", color: "#8ecae6", flip: true, scale: 0.8 },
  { id: "orange", top: "40%", duration: "24s", delay: "-6s", color: "#fb8500", flip: false, scale: 0.7 },
  { id: "sand", top: "72%", duration: "42s", delay: "-20s", color: "#ffd6a5", flip: true, scale: 0.9 },
];

export function SeaLife() {
  const [blub, setBlub] = useState<{ x: number; y: number } | null>(null);
  const [jellyBob, setJellyBob] = useState(false);

  function blubAt(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    let x = rect.left + rect.width / 2 - 52;
    let y = rect.top - 28;
    x = Math.min(window.innerWidth - 118, Math.max(8, x));
    y = Math.min(window.innerHeight - 28, Math.max(8, y));
    setBlub({ x, y });
    window.setTimeout(() => setBlub(null), 1600);
  }

  function pokeJelly() {
    setJellyBob(true);
    window.setTimeout(() => setJellyBob(false), 2200);
  }

  return (
    <>
      {FISH.map((fish) => (
        <button
          key={fish.id}
          type="button"
          className={`fish${fish.flip ? " flip" : ""}`}
          style={{
            top: fish.top,
            animationDuration: fish.duration,
            animationDelay: fish.delay,
            width: 64 * fish.scale,
            height: 32 * fish.scale,
          }}
          onClick={blubAt}
          aria-label="Fish"
        >
          <svg viewBox="0 0 64 32" aria-hidden="true">
            <ellipse cx="34" cy="16" rx="18" ry="8" fill={fish.color} />
            <path d="M16 16 L4 8 L8 16 L4 24 Z" fill={fish.color} />
            <circle cx="44" cy="14" r="1.6" fill="#143044" />
          </svg>
        </button>
      ))}
      {blub ? (
        <span className="blub" style={{ left: blub.x, top: blub.y }}>
          blub blub blub
        </span>
      ) : null}

      <button
        type="button"
        className={jellyBob ? "jelly bobbing" : "jelly"}
        onClick={pokeJelly}
        aria-label="Jellyfish"
      >
        <svg viewBox="0 0 80 130" aria-hidden="true">
          <ellipse cx="40" cy="34" rx="26" ry="22" fill="rgba(186,230,245,.55)" />
          <ellipse cx="40" cy="32" rx="18" ry="14" fill="rgba(255,255,255,.45)" />
          <path d="M16 36 C12 48 18 54 24 50 C20 56 28 58 32 52 C30 60 40 62 44 54 C46 62 58 58 56 50 C64 56 70 48 64 36 C58 48 22 48 16 36 Z" fill="rgba(120,196,214,.45)" />
          <ellipse cx="32" cy="30" rx="4" ry="6" fill="rgba(255,255,255,.7)" />
          <ellipse cx="48" cy="30" rx="4" ry="6" fill="rgba(255,176,214,.55)" />
          <path d="M30 40 C28 70 24 96 30 118" stroke="rgba(255,255,255,.75)" strokeWidth="3" fill="none" />
          <path d="M40 42 C42 74 38 100 44 122" stroke="rgba(255,255,255,.8)" strokeWidth="3.4" fill="none" />
          <path d="M50 40 C54 68 58 92 52 114" stroke="rgba(255,255,255,.7)" strokeWidth="2.6" fill="none" />
          <path d="M22 44 C16 66 18 84 14 102" stroke="rgba(210,240,248,.7)" strokeWidth="1.3" fill="none" />
          <path d="M26 46 C24 72 20 90 22 110" stroke="rgba(210,240,248,.65)" strokeWidth="1.1" fill="none" />
          <path d="M58 44 C66 66 62 88 68 104" stroke="rgba(210,240,248,.7)" strokeWidth="1.3" fill="none" />
          <path d="M54 46 C56 74 60 92 58 112" stroke="rgba(210,240,248,.65)" strokeWidth="1.1" fill="none" />
        </svg>
      </button>

      <svg className="kelp kelp-left" viewBox="0 0 80 180" aria-hidden="true">
        <path d="M40 180 C30 140 55 120 36 90 C18 62 48 40 34 8" stroke="#1f8a62" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M36 180 C58 150 22 130 48 100 C70 74 40 50 58 16" stroke="#146b4c" strokeWidth="7" fill="none" strokeLinecap="round" />
      </svg>
      <svg className="kelp kelp-right" viewBox="0 0 80 180" aria-hidden="true">
        <path d="M30 180 C48 140 18 110 40 80 C58 54 28 30 46 6" stroke="#1f8a62" strokeWidth="10" fill="none" strokeLinecap="round" />
      </svg>

      <svg className="starfish" viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M32 6 L38 24 L56 24 L42 36 L48 54 L32 44 L16 54 L22 36 L8 24 L26 24 Z"
          fill="#ffb085"
          stroke="#e07a4c"
          strokeWidth="2"
        />
      </svg>
    </>
  );
}
