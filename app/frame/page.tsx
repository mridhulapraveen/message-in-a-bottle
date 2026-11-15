"use client";

import { IM_Fell_English, Silkscreen } from "next/font/google";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AnchorIcon, LanternIcon } from "@/components/ui/Icons";

type FrameMessage = { id: string; name: string; body: string; kind?: string; src?: string };

type Feed = {
  state: "locked" | "reminder" | "unlocked" | "quiet";
  prompt?: string;
  answered?: number;
  total?: number;
  members?: { name: string; answered: boolean; you: boolean }[];
  messages?: FrameMessage[];
  waiting?: FrameMessage[];
};

const POLL_MS = 10_000;
const ROTATE_MS = 20_000;
const FADE_MS = 600;

const ink = IM_Fell_English({ weight: "400", subsets: ["latin"], style: ["normal", "italic"] });
const pixel = Silkscreen({ weight: "400", subsets: ["latin"] });

const css = `
.fr{position:fixed;inset:0;background:#061018;color:#d7c7a2;display:flex;flex-direction:column;justify-content:space-between;padding:3.2vw 4vw;font-family:${ink.style.fontFamily},Georgia,serif;cursor:none;user-select:none;overflow:hidden;z-index:5}
.fr-quiet{background:#000}
.fr-sky{position:absolute;inset:0;background:linear-gradient(180deg,#101c2c 0%,#0a1522 46%,#061018 100%);pointer-events:none}
.fr-far,.fr-near{position:absolute;left:0;width:100%;pointer-events:none;image-rendering:pixelated}
.fr-far{bottom:14vh;height:8vh}
.fr-near{bottom:0;height:16vh;animation:fr-drift 48s linear infinite}
@keyframes fr-drift{from{transform:translateX(0)}to{transform:translateX(-4vw)}}
.fr-stage{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:0;gap:1.6vw}
.fr-sign{width:min(78vw,640px);padding:2.4vw 3vw;text-align:center;color:#f6e7c4;background:linear-gradient(#8d5a32,#5c381c 58%,#3a2414);border:3px solid #24160e;box-shadow:inset 0 3px 0 #c99560,inset 0 -4px 0 #24160e,4px 4px 0 #05080c}
.fr-q{font-family:${pixel.style.fontFamily},monospace;font-size:3.2vw;line-height:1.35;margin:0;font-weight:400}
.fr-s{font-size:2.2vw;margin:1.2vw 0 0;color:#e8c48a}
.fr-s.warn{color:#e9b44c}
.fr-note{position:relative;width:min(72vw,560px);padding:3.2vw 3.4vw 2.4vw;color:#3c2916;background:#e4c48a;clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 14px),calc(100% - 16px) 100%,14px 100%,0 calc(100% - 12px),0 10px);box-shadow:4px 4px 0 #05080c}
.fr-seal{position:absolute;top:1.4vw;right:1.8vw;width:2.6vw;height:2.6vw;min-width:14px;min-height:14px;border-radius:50%;background:#8a2a2a;box-shadow:inset -2px -2px 0 #5c1414,inset 2px 2px 0 #c45a4a}
.fr-msg{line-height:1.25;margin:0;transition:opacity ${FADE_MS}ms}
.fr-tag{display:inline-block;margin-top:1.4vw;padding:.25vw .9vw;background:linear-gradient(#a87444,#6b4124);color:#f6e7c4;border:2px solid #3a2414;font-size:2.2vw}
.fr-media{display:block;width:100%;max-height:34vh;object-fit:contain;background:#2a1c10}
.fr-who{position:relative;z-index:2;display:flex;flex-wrap:wrap;gap:2vw 2.6vw}
.fr-who span{display:flex;flex-direction:column;align-items:center;gap:.35vw;font-size:2.2vw;color:#cbb892}
.fr-lantern{width:3.4vw;height:3.4vw;image-rendering:pixelated}
.fr-lantern.lit{filter:drop-shadow(0 0 5px #c9a24a)}
.lantern-pulse{animation:fr-p 7s ease-in-out infinite}
@keyframes fr-p{50%{opacity:.4}}
@media (prefers-reduced-motion:reduce){.lantern-pulse,.fr-near{animation:none}}
.fr-off{position:absolute;top:2vw;left:3vw;z-index:3;display:flex;align-items:center;gap:.7vw;font-size:2.2vw;color:#c9a24a}
.fr-off svg{width:2.6vw;height:2.6vw;image-rendering:pixelated}
.fr-alert{margin:0;font-size:2.2vw;color:#e9b44c}
`;

function Note({ children }: { children: ReactNode }) {
  return (
    <article className="fr-note">
      <span className="fr-seal" aria-hidden="true" />
      {children}
    </article>
  );
}

function kindLabel(kind?: string) {
  if (kind === "photo") return "picture";
  if (kind === "audio") return "voice note";
  return "video";
}

function chime() {
  const Context = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;
  const audio = new Context();
  const tone = (frequency: number, at: number) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audio.currentTime + at);
    gain.gain.exponentialRampToValueAtTime(0.05, audio.currentTime + at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + at + 0.35);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(audio.currentTime + at);
    osc.stop(audio.currentTime + at + 0.4);
  };
  void audio.resume().then(() => {
    tone(659, 0);
    tone(880, 0.18);
    window.setTimeout(() => void audio.close(), 900);
  });
}

export default function FramePage() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [offline, setOffline] = useState(false);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [alert, setAlert] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("t") ?? "";
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/device/feed?t=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data: Feed = await res.json();
        if (alive) {
          setFeed(data);
          setOffline(false);
        }
      } catch {
        if (alive) setOffline(true);
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const messages = feed?.messages ?? [];

  useEffect(() => {
    if (!feed || feed.state === "quiet") {
      seen.current = null;
      return;
    }
    const arrived = [...(feed.messages ?? []), ...(feed.waiting ?? [])];
    if (seen.current === null) {
      seen.current = new Set(arrived.map((item) => item.id));
      return;
    }
    const fresh = arrived.filter((item) => !seen.current?.has(item.id));
    for (const item of arrived) seen.current.add(item.id);
    if (!fresh.length) return;
    const newest = fresh[fresh.length - 1];
    const spot = (feed.messages ?? []).findIndex((item) => item.id === newest.id);
    if (spot >= 0) {
      setVisible(true);
      setIndex(spot);
      setAlert(`New message from ${newest.name}`);
    } else {
      setAlert(`${newest.name} sent a ${kindLabel(newest.kind)}. Answer in the app to see it.`);
    }
    chime();
  }, [feed]);

  useEffect(() => {
    if (!alert) return;
    const id = window.setTimeout(() => setAlert(null), 20_000);
    return () => window.clearTimeout(id);
  }, [alert]);

  useEffect(() => {
    if (messages.length < 2) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((n) => (n + 1) % messages.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [messages.length]);

  const msg = messages.length ? messages[index % messages.length] : null;
  const reminder = feed?.state === "reminder";
  const left = (feed?.total ?? 0) - (feed?.answered ?? 0);
  const size = !msg ? "4vw" : msg.body.length > 90 ? "4vw" : msg.body.length > 45 ? "5.2vw" : "6.6vw";

  return (
    <main className={`fr${feed?.state === "quiet" ? " fr-quiet" : ""}`}>
      <style>{css}</style>
      {feed?.state === "quiet" ? null : (
        <>
          <div className="fr-sky" aria-hidden="true" />
          <svg className="fr-far" viewBox="0 0 160 24" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
            <path fill="#16324a" d="M0 10h8v2H0zM12 8h10v2H12zM28 11h14v2H28zM48 7h8v2H48zM62 10h18v2H62zM86 8h12v2H86zM104 11h16v2H104zM126 7h10v2h-10zM142 10h18v2h-18zM0 14h160v10H0z" />
          </svg>
          <svg className="fr-near" viewBox="0 0 160 32" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
            <path fill="#0c2436" d="M0 8h12v4H0zM16 4h18v4H16zM40 10h22v4H40zM68 6h16v4H68zM90 12h24v4H90zM120 5h18v4h-18zM144 9h16v4h-16zM0 16h160v16H0z" />
          </svg>
        </>
      )}
      {offline && feed?.state !== "quiet" ? (
        <div className="fr-off">
          <AnchorIcon />
          No connection
        </div>
      ) : null}
      {!feed ? (
        <p className="fr-s">Connecting…</p>
      ) : feed.state === "quiet" ? null : (
        <>
          {feed.state === "unlocked" ? (
            <section className="fr-stage">
              {alert ? <p className="fr-alert">{alert}</p> : null}
              <Note>
                {msg ? (
                  <div className="fr-msg" style={{ opacity: visible ? 1 : 0 }}>
                    {msg.kind === "photo" && msg.src ? (
                      <img className="fr-media" src={msg.src} alt="" />
                    ) : msg.kind === "video" && msg.src ? (
                      <video className="fr-media" src={msg.src} controls autoPlay playsInline />
                    ) : msg.kind === "audio" && msg.src ? (
                      <audio src={msg.src} controls autoPlay />
                    ) : (
                      <p style={{ fontSize: size, margin: 0, color: "#3c2916" }}>{msg.body}</p>
                    )}
                    <p className="fr-tag">{msg.name}</p>
                  </div>
                ) : (
                  <p className={`fr-q ${pixel.className}`} style={{ color: "#3c2916" }}>
                    Nobody else has answered yet.
                  </p>
                )}
              </Note>
            </section>
          ) : (
            <section className="fr-stage">
              {alert ? <p className="fr-alert">{alert}</p> : null}
              <div className="fr-sign">
                <h1 className={`fr-q ${pixel.className}`}>{feed.prompt}</h1>
                <p className={`fr-s${reminder ? " warn" : ""}`}>
                  {reminder
                    ? left === 1
                      ? "You’re the last one."
                      : `${feed.answered} of ${feed.total} have answered.`
                    : "Answer in the app to read theirs."}
                </p>
              </div>
            </section>
          )}
          <footer className="fr-who">
            {feed.members?.map((member) => {
              const pulse = !member.answered && reminder && member.you;
              return (
                <span key={member.name}>
                  <LanternIcon className={`fr-lantern${member.answered ? " lit" : ""}`} lit={member.answered} pulse={pulse} />
                  {member.name}
                </span>
              );
            })}
          </footer>
        </>
      )}
    </main>
  );
}
