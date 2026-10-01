import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"),
  title: {
    default: "BoardReady — Class 10 NCERT Quiz",
    template: "%s · BoardReady",
  },
  description:
    "Interactive Class 10 NCERT quizzes with instant scoring, chapter practice, leaderboards, and shareable results.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
