export function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

export function SlidersIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M8 12h8M10 18h4" strokeLinecap="round" />
      <circle cx="7" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="18" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
