# BoardReady (ncert10-quiz)

Interactive Class 10 NCERT quiz platform: chapter practice, instant server-side scoring, leaderboards, and shareable result pages.

This is a student-facing web app with a notebook-style UI, not an official CBSE or NCERT product. Question items are original MCQs mapped to Class 10 NCERT chapter themes.

## Product in one pass

1. Student sets a quiz name on the home desk.
2. Student picks Maths, Science, SST, English, a chapter, or the daily mix.
3. Eight MCQs run with a 45-second timer and large tap targets.
4. Submit posts answers to `/api/attempts`. The server scores against the hidden answer key.
5. Result page shows percentage, explanations, and share actions (system share, WhatsApp, post, copy).
6. Score is written to a persisted leaderboard.

## Architecture

```
Browser (Next.js App Router UI)
    │
    ├── GET /api/quiz          public questions only
    ├── POST /api/attempts     score + persist
    ├── GET /api/leaderboard
    └── GET /api/health        Compose + CI health
         │
         ▼
  JSON question banks     JSON leaderboard volume
  src/data/questions/     .data/leaderboard.json
```

| Layer | Choice | Why |
| --- | --- | --- |
| UI | Next.js 15 App Router + Tailwind | Fast pages, SSR result links for sharing |
| Scoring | Pure function + API route | Browser never receives the key during the quiz |
| Data | Versioned JSON banks | Easy to review, easy to validate in CI |
| Persistence | File store on a Docker volume | Works without standing up Postgres on day one |
| Delivery | Multi-stage Docker + Compose | Repeatable run in any environment |
| Quality gate | GitHub Actions | Bank validation, lint, typecheck, build, image build |

## Folder map

```
ncert10-quiz/
  .github/workflows/ci.yml     quality + Docker image (no push)
  docker-compose.yml           app + persistent volume
  Dockerfile                   deps → build → non-root runner
  scripts/validate-bank.mjs    question-bank contract
  src/app/                     pages and API routes
  src/components/              quiz player, share, shell
  src/data/questions/          Maths, Science, SST, English
  src/lib/                     bank, scoring, store, share
```

## UX rules used

- Paper background, serif titles, high-contrast ink — reads like a class notebook, not a cartoon game.
- One question on screen, progress bar, visible timer.
- Correct answers and explanations appear only after scoring (no “practice leak”).
- Leaderboard uses a nickname, not a school email.
- Result URLs are shareable (Open Graph title includes the score).

## DevOps loop (how this repo is meant to be worked)

1. **Plan** — subjects, scoring rules, share contract, health endpoint.
2. **Build** — feature on a branch; keep scoring in `src/lib/scoring.ts`.
3. **Verify** — `npm run validate:bank` then a local quiz + leaderboard check.
4. **Integrate** — PR runs GitHub Actions (`quality` then `image`).
5. **Release** — `docker compose up --build -d`; Compose healthcheck watches `/api/health`.
6. **Operate** — leaderboard file lives on volume `quiz-data`; inspect with `docker compose logs -f web`.

## Local run

```bash
cd ncert10-quiz
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000`.

```bash
npm test              # question bank contract
npm run lint
npm run typecheck
npm run build
```

## Docker run

```bash
docker compose up --build
```

Health: `http://localhost:3000/api/health`

## Extending the syllabus

Add items to `src/data/questions/*.json`. Each question must have:

- unique `id`
- four `options`
- `correctOptionId` matching one option
- `explanation` and `ncertRef`

CI fails if a bank drops below 8 questions or if the contract breaks.

To add a subject, register it in `src/lib/bank.ts` and add a JSON file.

## Later production upgrades

- Swap the JSON store for Postgres + Prisma using the same `AttemptResult` shape.
- Put the image on a registry in the `image` job (`push: true` + login).
- Add rate limits on `POST /api/attempts`.
- Expand banks to full chapter coverage and Hindi.
