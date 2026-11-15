export function Lobster({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 150"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d="M68 52 C58 24 42 12 30 6" stroke="#7a2418" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M92 52 C102 24 118 12 130 6" stroke="#7a2418" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M80 104 C52 114 40 132 56 146 C72 138 84 124 88 110 Z" fill="#c4452d" />
      <path d="M62 132 L46 146 L66 138 Z" fill="#ef6a45" />
      <path d="M98 132 L114 146 L94 138 Z" fill="#ef6a45" />
      <g stroke="#a33a28" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M58 108 L44 128" />
        <path d="M68 112 L60 134" />
        <path d="M92 112 L100 134" />
        <path d="M102 108 L116 128" />
      </g>
      <ellipse cx="80" cy="78" rx="32" ry="26" fill="#e25b3a" />
      <ellipse cx="80" cy="88" rx="16" ry="11" fill="#f6c09a" />
      <circle cx="66" cy="56" r="6.5" fill="#1c120c" />
      <circle cx="94" cy="56" r="6.5" fill="#1c120c" />
      <circle cx="68" cy="54" r="2" fill="#fff" />
      <circle cx="96" cy="54" r="2" fill="#fff" />
      <path d="M74 66 Q80 70 86 66" stroke="#111" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <g transform="translate(58,80)">
        <rect x="16" y="0" width="12" height="8" rx="2" fill="#c98a4b" />
        <path
          d="M17 8h10v6c0 2.2 8 4 8 11v14a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5V25c0-7 8-8.8 8-11z"
          fill="#bfeaf2"
          stroke="#fff"
          strokeWidth="1.4"
        />
        <rect x="16" y="22" width="12" height="16" rx="1.5" fill="#f7e8c3" />
        <path d="M19 27h7M19 31h7M19 35h4" stroke="#b9955a" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <path d="M54 74 C28 64 18 96 38 112 C54 124 72 104 64 84 Z" fill="#d84b34" />
      <path d="M40 98 C56 86 70 100 58 116" stroke="#7a2418" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M106 74 C132 64 142 96 122 112 C106 124 88 104 96 84 Z" fill="#d84b34" />
      <path d="M120 98 C104 86 90 100 102 116" stroke="#7a2418" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
