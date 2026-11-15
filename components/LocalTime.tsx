"use client";

import { useEffect, useState } from "react";

export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(iso);

  useEffect(() => {
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) {
      setText(date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    }
  }, [iso]);

  return <time dateTime={iso}>{text}</time>;
}
