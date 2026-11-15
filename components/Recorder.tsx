"use client";

import { useRef, useState } from "react";

import { Bottle } from "@/components/Bottle";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

const MAX_BYTES = 300 * 1024 * 1024;

function fmt(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function pickMime(kind: "audio" | "video") {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function fileExt(blob: Blob) {
  const type = blob.type || "";
  if (type.includes("png")) return "png";
  if (type.includes("gif")) return "gif";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

export function Recorder({ groupId, maxSeconds }: { groupId: number; maxSeconds: number }) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const [kind, setKind] = useState<"audio" | "video" | "photo">("audio");
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [timer, setTimer] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function clearPhoto() {
    setPhotoUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  async function startRecording(nextKind: "audio" | "video") {
    clearPhoto();
    setKind(nextKind);
    setBlob(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: nextKind === "video",
      });
    } catch {
      alert("Couldn't access your camera/microphone. Check browser permissions (and use HTTPS or localhost).");
      return;
    }

    const mimeType = pickMime(nextKind);
    const options: MediaRecorderOptions = {};
    if (mimeType) options.mimeType = mimeType;
    if (nextKind === "video") options.videoBitsPerSecond = 1_000_000;
    const recorder = new MediaRecorder(stream, options);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      clearTimer();
      const recorded = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || (nextKind === "video" ? "video/webm" : "audio/webm"),
      });
      stream.getTracks().forEach((track) => track.stop());
      const preview = previewRef.current;
      if (preview) {
        preview.srcObject = null;
        preview.muted = false;
        preview.src = URL.createObjectURL(recorded);
        preview.controls = true;
      }
      setBlob(recorded);
      setShowPreview(true);
      setRecording(false);
      setTimer(`Recorded ${fmt(secondsRef.current)}`);
    };

    const preview = previewRef.current;
    if (preview && nextKind === "video") {
      preview.srcObject = stream;
      preview.muted = true;
      preview.controls = false;
      setShowPreview(true);
      void preview.play();
    } else {
      setShowPreview(false);
    }

    recorder.start();
    secondsRef.current = 0;
    setRecording(true);
    setTimer(`● ${fmt(0)} / ${fmt(maxSeconds)}`);
    timerRef.current = window.setInterval(() => {
      secondsRef.current += 1;
      setTimer(`● ${fmt(secondsRef.current)} / ${fmt(maxSeconds)}`);
      if (secondsRef.current >= maxSeconds) stopRecording();
    }, 1000);
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    setRecording(false);
    setShowPreview(true);
  }

  function choosePhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Choose a picture file.");
      return;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    clearPhoto();
    setKind("photo");
    setBlob(file);
    setPhotoUrl(URL.createObjectURL(file));
    setShowPreview(false);
    setTimer("");
  }

  function send() {
    if (!blob || sending) return;
    if (blob.size > MAX_BYTES) {
      alert("That file is over 300 MB. Try a shorter recording or a smaller picture.");
      return;
    }
    setSending(true);
    setProgress(8);
    const form = new FormData();
    form.append("media", blob, `message.${fileExt(blob)}`);
    form.append("kind", kind);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/groups/${groupId}/upload`);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      setProgress(Math.max(8, Math.min(96, Math.round((event.loaded / event.total) * 100))));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        window.setTimeout(() => window.location.reload(), 450);
        return;
      }
      alert(`Upload failed: ${xhr.responseText}`);
      setSending(false);
    };
    xhr.onerror = () => {
      alert("Upload failed. Check your connection and try again.");
      setSending(false);
    };
    xhr.send(form);
  }

  return (
    <Panel>
      <h2>Your reply (up to {Math.floor(maxSeconds / 60)} minutes)</h2>
      <Button type="button" onClick={() => startRecording("video")} disabled={recording || sending}>
        Record video
      </Button>
      <Button type="button" className="sea" onClick={() => startRecording("audio")} disabled={recording || sending}>
        Record audio
      </Button>
      <label className={`file-btn${recording || sending ? " disabled" : ""}`}>
        Upload a picture
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={recording || sending}
          onChange={(event) => {
            choosePhoto(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      <Button type="button" className="ghost" onClick={stopRecording} disabled={!recording}>
        Stop
      </Button>
      <span className="timer">{timer}</span>
      <video ref={previewRef} playsInline style={{ display: showPreview ? "block" : "none" }} />
      {photoUrl ? <img className="photo-preview" src={photoUrl} alt="Picture ready to send" /> : null}
      {blob && !sending ? (
        <Button type="button" className="sea" onClick={send}>
          Cast into the sea
        </Button>
      ) : null}
      {sending ? (
        <div className="voyage" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="voyage-track">
            <span className="voyage-note" style={{ left: `${progress * 0.78}%` }}>
              <svg viewBox="0 0 36 28" aria-hidden="true">
                <rect x="2" y="4" width="32" height="20" rx="2" fill="#f7e8c3" stroke="#b9955a" />
                <path d="M7 10h16M7 14h18M7 18h10" stroke="#b9955a" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <Bottle className="voyage-bottle" />
          </div>
          <p className="voyage-label">The message is finding its bottle…</p>
        </div>
      ) : null}
    </Panel>
  );
}
