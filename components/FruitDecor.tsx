export default function FruitDecor({ className = "" }: { className?: string }) {
  return <svg className={`fruit-decor ${className}`} viewBox="0 0 210 100" fill="none" aria-hidden="true" focusable="false">
    <path d="M25 76c-11-6-18-3-19 4 11 5 18 4 19-4ZM190 28c5-12 14-14 18-9-5 12-11 15-18 9Z" fill="#96b79a" />
    <g transform="rotate(-19 45 53)">
      <path d="M12 38h66a33 33 0 0 1-66 0Z" fill="#4d8a64" />
      <path d="M17 38h56a28 28 0 0 1-56 0Z" fill="#e7efc8" />
      <path d="M22 38h46a23 23 0 0 1-46 0Z" fill="#ed8276" />
      <path d="m34 45 1 4m10-2v4m12-6-1 4" stroke="#683e39" strokeWidth="2.2" strokeLinecap="round" />
    </g>
    <g transform="rotate(13 104 55)">
      <path d="M104 26c2-12 12-16 21-12-4 10-12 15-21 12Z" fill="#60946b" />
      <path d="M102 24v8" stroke="#5a7954" strokeWidth="3" strokeLinecap="round" />
      <circle cx="103" cy="57" r="29" fill="#f2b759" />
      <circle cx="103" cy="57" r="23" fill="#ffdf94" />
      <path d="m103 35 1 17 13-10m-8 15 16-2m-19 8 10 13m-16-11-6 14m0-20-13 6m13-13-7-12" stroke="#fff5d7" strokeWidth="3" strokeLinecap="round" />
      <circle cx="103" cy="57" r="4" fill="#fff5d7" />
    </g>
    <g transform="rotate(14 166 49)">
      <path d="M143 43c-7 17 8 43 22 46 14-3 29-29 23-46-4-12-14-14-23-8-10-6-18-3-22 8Z" fill="#df776f" />
      <path d="m165 36-13 6 4-11-9-5 14-1 4-11 5 11 13 1-9 6 4 10-13-6Z" fill="#60946b" />
      <path d="m155 48 1 3m17-4-1 3m-11 9 1 3m14-1-1 3m-10 9v3" stroke="#ffe4ae" strokeWidth="2.5" strokeLinecap="round" />
    </g>
    <circle cx="76" cy="20" r="2.5" fill="#e6c58a" /><circle cx="134" cy="89" r="2" fill="#b4c69e" />
    <path d="m26 14 1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4Z" fill="#e9be79" />
  </svg>;
}
