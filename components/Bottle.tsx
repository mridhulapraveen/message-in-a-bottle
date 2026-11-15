export function Bottle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <g transform="rotate(35 32 32)">
        <rect x="26" y="4" width="12" height="9" rx="2" fill="#c98a4b" />
        <path
          d="M27 13h10v8c0 3 9 5 9 14v17a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V35c0-9 9-11 9-14z"
          fill="#bfeaf2"
          stroke="#fff"
          strokeWidth="2"
        />
        <rect x="25" y="34" width="14" height="18" rx="2" fill="#f7e8c3" />
        <path d="M28 39h8M28 43h8M28 47h5" stroke="#b9955a" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
