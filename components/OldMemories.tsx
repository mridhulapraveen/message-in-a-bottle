"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";

export type MemoryComment = {
  id: number;
  username: string;
  avatar: string | null;
  body: string | null;
  filename: string | null;
};

export type Memory = {
  id: number;
  username: string;
  day: string;
  kind: string;
  filename: string;
  prompt: string | null;
  comments: MemoryComment[];
};

export function OldMemories({ memories }: { memories: Memory[] }) {
  const [page, setPage] = useState(0);
  const spreads = Math.max(1, Math.ceil(memories.length / 2));
  const left = memories[page * 2];
  const right = memories[page * 2 + 1];

  if (memories.length === 0) return null;

  return (
    <section className="memories">
      <div className="memory-book">
        <h2>old memories</h2>
          <div className="memory-cover">
            <span className="memory-edge left" aria-hidden="true" />
            <span className="memory-edge right" aria-hidden="true" />
            <div className="memory-spread">
              <Page key={left?.id ?? "left-blank"} memory={left} side="left" />
              <Page key={right?.id ?? "right-blank"} memory={right} side="right" />
              <span className="memory-spine" aria-hidden="true" />
              <svg className="memory-butterfly" viewBox="0 0 70 60" aria-hidden="true">
                <path d="M34 32c-8-16-24-18-28-8s6 16 16 16c4 8 10 12 12 8" fill="#f4c7d8" stroke="#5c4636" strokeWidth="1.4" />
                <path d="M36 32c8-16 24-18 28-8s-6 16-16 16c-4 8-10 12-12 8" fill="#f7e3b0" stroke="#5c4636" strokeWidth="1.4" />
                <path d="M35 18c1 8 1 16 0 24" stroke="#5c4636" strokeWidth="1.6" fill="none" />
              </svg>
            </div>
          </div>
          <div className="memory-nav">
            <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} aria-label="Previous pages">
              <Arrow direction="left" />
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(spreads - 1, value + 1))}
              disabled={page >= spreads - 1}
              aria-label="Next pages"
            >
              <Arrow direction="right" />
            </button>
          </div>
        </div>
    </section>
  );
}

function Page({ memory, side }: { memory?: Memory; side: "left" | "right" }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <article className={`memory-page ${side}`}>
      {memory?.prompt ? <p className="memory-prompt">{memory.prompt}</p> : null}
      <div className="memory-frame">
        {memory ? <MemoryMedia memory={memory} /> : <p>This page is still blank.</p>}
      </div>
      {memory ? (
        <>
          <p className="memory-caption">
            {memory.username}
            <span>{memory.day}</span>
          </p>
          <button type="button" className="memory-comments-toggle" onClick={() => setShowComments((value) => !value)}>
            {showComments ? "Hide comments" : "Comments"}
          </button>
          {showComments ? (
            <div className="memory-comments">
              {memory.comments.length === 0 ? <p>No comments yet.</p> : null}
              {memory.comments.map((comment) => (
                <div className="comment" key={comment.id}>
                  <span className="name-row">
                    <Avatar id={comment.avatar} className="avatar avatar-sm" />
                    <strong>{comment.username}</strong>
                  </span>
                  {comment.body ? <p>{comment.body}</p> : null}
                  {comment.filename ? (
                    <img className="comment-photo" src={`/uploads/${comment.filename}`} alt={`${comment.username}'s comment picture`} />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </article>
  );
}

function MemoryMedia({ memory }: { memory: Memory }) {
  if (memory.kind === "video") {
    return <video controls playsInline src={`/uploads/${memory.filename}`} />;
  }
  if (memory.kind === "photo") {
    return <img src={`/uploads/${memory.filename}`} alt={`${memory.username}'s memory`} />;
  }
  return <audio controls src={`/uploads/${memory.filename}`} />;
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 64 28" aria-hidden="true">
      {direction === "right" ? (
        <path d="M2 14h48M38 4l16 10L38 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M62 14H14M26 4L10 14l16 10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
