import type { ReactNode } from "react";

type IconProps = { className?: string; title?: string };

function PixelIcon({ className, title, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 16 16" width="16" height="16" shapeRendering="crispEdges" aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function AnchorIcon(props: IconProps) {
  return (
    <PixelIcon {...props}>
      <path fill="#e8c48a" d="M7 1h2v2H7zM6 3h4v1H6zM7 4h2v5H7zM4 8h8v1H4zM5 9h2v1H5zM9 9h2v1H9zM4 10h2v2H4zM10 10h2v2h-2zM5 12h2v1H5zM9 12h2v1H9zM6 13h4v1H6z" />
    </PixelIcon>
  );
}

export function ShipWheelIcon(props: IconProps) {
  return (
    <PixelIcon {...props}>
      <path fill="#f2ddb4" d="M7 1h2v2H7zM7 13h2v2H7zM1 7h2v2H1zM13 7h2v2h-2z" />
      <path fill="#c99560" d="M6 3h4v1H6zM6 12h4v1H6zM3 6h1v4H3zM12 6h1v4h-1zM5 5h6v6H5z" />
      <path fill="#6b3f22" d="M7 7h2v2H7z" />
    </PixelIcon>
  );
}

export function BottleIcon(props: IconProps) {
  return (
    <PixelIcon {...props}>
      <path fill="#3a2414" d="M6 0h4v1H6zM5 1h6v2H5zM4 3h8v2H4zM3 5h10v8H3zM4 13h8v2H4z" />
      <path fill="#d7eef2" d="M6 4h4v1H6zM5 6h6v6H5zM6 12h4v1H6z" />
      <path fill="#e8c48a" d="M6 8h4v4H6z" />
    </PixelIcon>
  );
}

export function ChestIcon(props: IconProps) {
  return (
    <PixelIcon {...props}>
      <path fill="#8d5a32" d="M2 6h12v8H2z" />
      <path fill="#c99560" d="M3 4h10v3H3zM3 7h10v1H3z" />
      <path fill="#e2b340" d="M7 8h2v2H7z" />
    </PixelIcon>
  );
}

export function LanternIcon({ lit, pulse, className }: IconProps & { lit?: boolean; pulse?: boolean }) {
  const glass = lit ? "#f2c14e" : pulse ? "#e9b44c" : "#2a3340";
  return (
    <svg className={`${className ?? ""} ${pulse ? "lantern-pulse" : ""}`} viewBox="0 0 16 16" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="#6b3f22" d="M6 1h4v1H6zM7 2h2v1H7zM5 4h6v1H5zM4 5h8v6H4zM5 11h6v1H5zM6 13h4v1H6z" />
      <path fill={glass} d="M5 6h6v4H5z" />
      {lit ? <path fill="#fff1c2" d="M7 7h2v2H7z" /> : null}
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <PixelIcon {...props}>
      <path fill="#c44536" d="M4 3h3v1H4zM9 3h3v1H9zM3 4h4v1H3zM9 4h4v1H9zM3 5h10v2H3zM4 7h8v1H4zM5 8h6v1H5zM6 9h4v1H6zM7 10h2v1H7z" />
    </PixelIcon>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <PixelIcon {...props}>
      <path fill="#6b3f22" d="M6 1h4v1H6zM3 3h2v1H3zM11 3h2v1h-2zM2 6h1v4H2zM13 6h1v4h-1zM3 12h2v1H3zM11 12h2v1h-2zM6 14h4v1H6z" />
      <path fill="#e8c48a" d="M5 4h6v8H5z" />
      <path fill="#c44536" d="M7 5h2v3H7z" />
      <path fill="#3d6b8a" d="M7 8h2v3H7z" />
    </PixelIcon>
  );
}
