import Link from "next/link";

const links = [
  { href: "/", label: "Subjects" },
  { href: "/results", label: "Saved Results" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
  { href: "/how-it-works", label: "How it works" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/80 px-4 py-3 shadow-sheet backdrop-blur">
        <Link href="/" className="font-display text-2xl tracking-tight">
          BoardReady
          <span className="ml-2 align-middle text-sm font-sans font-semibold text-ink/60">Class 10 NCERT</span>
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm font-semibold">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 transition hover:bg-highlight"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-12 pb-8 text-center text-sm text-ink/60">
        Practice questions inspired by NCERT Class 10 themes. Not an official CBSE paper.
      </footer>
    </div>
  );
}
