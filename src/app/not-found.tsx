import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-3xl bg-white p-10 text-center shadow-sheet">
      <h1 className="font-display text-4xl">That page is missing</h1>
      <p className="mt-2">Try a subject quiz from the home desk.</p>
      <Link href="/" className="mt-4 inline-block font-semibold underline">
        Back home
      </Link>
    </div>
  );
}
