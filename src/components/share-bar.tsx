"use client";

import { useState } from "react";
import { shareCopy, twitterUrl, whatsappUrl } from "@/lib/share";

type Props = {
  nickname: string;
  percent: number;
  subject: string;
  url: string;
};

export function ShareBar({ nickname, percent, subject, url }: Props) {
  const text = shareCopy(nickname, percent, subject);
  const [copied, setCopied] = useState(false);

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title: "NCERT10-Quiz-DevOps score", text, url });
      return;
    }
    await copy();
  }

  async function copy() {
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void nativeShare()}
        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
      >
        Share score
      </button>
      <a
        className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
        href={whatsappUrl(text, url)}
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp
      </a>
      <a
        className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
        href={twitterUrl(text, url)}
        target="_blank"
        rel="noreferrer"
      >
        Post
      </a>
      <button type="button" onClick={() => void copy()} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-ruled">
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
