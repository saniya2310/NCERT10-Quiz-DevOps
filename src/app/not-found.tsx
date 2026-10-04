import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-3xl bg-white p-10 text-center shadow-sheet">
      <span className="text-4xl">🧭</span>
      <h1 className="mt-2 font-display text-4xl">That page is missing</h1>
      <p className="mt-2 text-ink/70">The page or quiz you requested was not found. Choose a subject below or return home.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper">
          ← Back to Home
        </Link>
        <Link href="/quiz/mathematics" className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
          Maths Quiz
        </Link>
        <Link href="/quiz/science" className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">
          Science Quiz
        </Link>
        <Link href="/quiz/social-science" className="rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white">
          Social Science
        </Link>
        <Link href="/quiz/english" className="rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white">
          English Quiz
        </Link>
      </div>
    </div>
  );
}
