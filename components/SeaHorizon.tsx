"use client";

import { useEffect, useState } from "react";

function skyFor(hour: number) {
  if (hour >= 20 || hour < 6) return "night";
  if (hour >= 17) return "dusk";
  return "day";
}

export function SeaHorizon() {
  const [sky, setSky] = useState("day");

  useEffect(() => {
    const apply = () => setSky(skyFor(new Date().getHours()));
    apply();
    const id = window.setInterval(apply, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={`horizon sky-${sky}`} aria-hidden="true">
      <div className="horizon-sky" />
      <svg className="horizon-far" viewBox="0 0 160 24" preserveAspectRatio="none" shapeRendering="crispEdges">
        <path fill="#1d4e6e" d="M0 10h8v2H0zM12 8h10v2H12zM28 11h14v2H28zM48 7h8v2H48zM62 10h18v2H62zM86 8h12v2H86zM104 11h16v2H104zM126 7h10v2h-10zM142 10h18v2h-18zM0 14h160v10H0z" />
      </svg>
      <svg className="horizon-near" viewBox="0 0 160 32" preserveAspectRatio="none" shapeRendering="crispEdges">
        <path fill="#0c3a58" d="M0 8h12v4H0zM16 4h18v4H16zM40 10h22v4H40zM68 6h16v4H68zM90 12h24v4H90zM120 5h18v4h-18zM144 9h16v4h-16zM0 16h160v16H0z" />
      </svg>
    </div>
  );
}
