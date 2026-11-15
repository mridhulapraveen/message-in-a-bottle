"use client";

import { useState } from "react";

type Bubble = {
  id: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
};

export function SeaShell() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  function releaseBubbles() {
    const batch = Date.now();
    const next = Array.from({ length: 16 }, (_, index) => ({
      id: `${batch}-${index}`,
      left: 6 + Math.random() * 88,
      size: 8 + Math.random() * 20,
      duration: 3.2 + Math.random() * 3.4,
      delay: Math.random() * 0.35,
    }));
    setBubbles((current) => [...current, ...next]);
    window.setTimeout(() => {
      setBubbles((current) => current.filter((bubble) => !bubble.id.startsWith(`${batch}-`)));
    }, 8000);
  }

  return (
    <>
      <button type="button" className="seashell" onClick={releaseBubbles} aria-label="Tap the seashell to send bubbles up">
        <svg viewBox="0 0 80 72" aria-hidden="true">
          <path d="M40 66 C8 64 4 34 18 16 C26 6 40 2 40 2 C40 2 54 6 62 16 C76 34 72 64 40 66 Z" fill="#f7d7c4" stroke="#d7a88a" strokeWidth="1.4" />
          <path d="M40 63 L40 6" stroke="#fff8f2" strokeWidth="1.5" />
          <path d="M40 63 L24 12" stroke="#f3b7c6" strokeWidth="1.6" />
          <path d="M40 63 L56 12" stroke="#f3b7c6" strokeWidth="1.6" />
          <path d="M40 63 L14 24" stroke="#fff8f2" strokeWidth="1.3" />
          <path d="M40 63 L66 24" stroke="#fff8f2" strokeWidth="1.3" />
          <path d="M40 63 L18 40" stroke="#e7b89a" strokeWidth="1.2" />
          <path d="M40 63 L62 40" stroke="#e7b89a" strokeWidth="1.2" />
          <path d="M40 63 L28 52" stroke="#f7d7c4" strokeWidth="1.3" />
          <path d="M40 63 L52 52" stroke="#f7d7c4" strokeWidth="1.3" />
          <ellipse cx="40" cy="63" rx="11" ry="4.5" fill="#e7b89a" />
        </svg>
      </button>
      <div className="bubble-burst" aria-hidden="true">
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            style={{
              left: `${bubble.left}%`,
              width: bubble.size,
              height: bubble.size,
              animationDuration: `${bubble.duration}s`,
              animationDelay: `${bubble.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
