export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function shareCopy(nickname: string, percent: number, subject: string) {
  return `${nickname} scored ${percent}% on NCERT10-Quiz-DevOps (${subject}, Class 10 NCERT). Can you beat it?`;
}

export function whatsappUrl(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

export function twitterUrl(text: string, url: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}
