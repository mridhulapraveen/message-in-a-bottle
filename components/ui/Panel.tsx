import type { ReactNode } from "react";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`panel-shadow ${className ?? ""}`}>
      <div className="panel">
        <span className="nail n1" aria-hidden="true" />
        <span className="nail n2" aria-hidden="true" />
        <span className="nail n3" aria-hidden="true" />
        <span className="nail n4" aria-hidden="true" />
        <div className="panel-fill">{children}</div>
      </div>
    </div>
  );
}
