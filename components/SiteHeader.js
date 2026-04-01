import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Reflections" },
];

export default function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--teal)]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--teal)] text-white">Q</span>
        Quran Reflect
      </Link>
      <nav aria-label="Primary navigation">
        <ul className="flex items-center gap-2 text-sm">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-full px-4 py-2 text-slate-700 transition hover:bg-white hover:text-[var(--teal)] focus-visible:focus-ring"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
