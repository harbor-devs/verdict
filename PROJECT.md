# VERDICT: project notes

## What it is
A private finance app where you log money in and out, set budgets and savings goals, and ask "can I afford this?". It answers with a clear verdict in a friendly, witty voice.

## Core rules
- The math is deterministic. No AI model decides money results.
- Clean UI beats feature count. The earlier prototype got too complicated.
- Privacy first. Your data belongs to you.
- No fake data, fake auth or fake features in the real app. Anything mock is labelled as mock.

## Personality
Gen-Z friend voice. Funny, never cruel. No profanity and no unsafe advice.
Example tone: "Bro has Rs 3,200 and suddenly has desires."

## Stack
- Frontend: React, Vite, Tailwind CSS, TypeScript
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth: session cookies (not localStorage as a database)

## Data
users, transactions, budgets, savings goals, sessions, score history

## Build phases (in order)
1. Setup: repo, Git, docs
2. Database: PostgreSQL and tables
3. Backend: Express API with signup, login, validation
4. Verdict engine: rules and tests
5. Frontend: React screens connected to the real API
6. Deploy

## Working method
Discuss, small step, build, run, test, review, commit, next. One thing at a time.

## Security defaults
- Secrets only in .env (never committed); .env.example lists the names
- Passwords hashed, input validated on the server
- Real auth, no shortcuts

## Score rules (0 to 100, this month's data, no AI)
- Savings rate: 40 points. Full marks when you keep 20 percent or more of the month's income.
- Budget discipline: 30 points. Share of budgets that are within their limit. No budgets set gives 15.
- Goals progress: 15 points. Average progress across goals, each capped at 100 percent. No goals gives 7.
- Cushion: 15 points. Full marks when the balance covers 3 months of this month's spending.
- No income logged this month means no score ("not enough data"), never an invented number.
- Bands: 80 and up solid, 60 to 79 okay, 40 to 59 shaky, under 40 rough.
- Savings goals only move their own counter for now. They do not change the balance.

## Frontend (client folder)
- Direction: "money with receipts". Cream paper look, ink text, receipt-style lists (dashed lines), verdict shown as a rubber stamp (YES green, RISKY amber, NO red). Simple cards, no clutter.
- Setup: Vite, React, TypeScript, ESLint, Tailwind v4 (plugin in vite.config.ts, tokens in src/index.css under @theme), react-router v7.
- Fonts (self-hosted with fontsource, all OFL): DM Sans (font-sans, body), DM Mono (font-mono, money amounts), Bricolage Grotesque (font-display, headlines and stamps).
- Colour names: paper, card, line, ink, muted, yes, risky, no.
- Card style: rounded-2xl, border-line, bg-card, p-5. Receipt rows: divide-y divide-dashed divide-line.
- API: src/api/client.ts has api<T>(path, { method, body }). It sends the cookie and throws ApiError(status, code, message, fields). Response types live in src/api/types.ts.
- Money: the server sends amounts as text like "1234.50". The client only formats them (src/lib/format.ts) and never does money math.
- Auth: src/lib/authContext.ts (useAuth) and AuthProvider.tsx. User = { id, email, displayName, currency }.
- Screens: Sign up and Log in (done), Home (done), Transactions (done), Budgets (done), Goals, Can I afford this? (not built). A shared navigation bar and the design pass come after the screens.

## Status log
- 2026-11-04: repo created under harbor-devs, Git set up, docs added, Express server with health route.
- 2026-11-04: Phase 2 done (PostgreSQL schema and migrations). Phase 3 done: signup, login, logout, /me, scrypt password hashing, cookie sessions (token hash stored in the database), zod validation, helmet, CORS, rate limiting. Failure cases tested by hand, no automated tests yet.
- 2026-11-04: Verdict engine built (YES, RISKY, NO with a 20 percent buffer rule), humour voice lines, exact money helpers, 16 automated tests. API routes built and hand-tested: transactions (add, list, delete), budgets (set, list, delete), and the "can I afford this?" verdict route.
- 2026-11-05: Savings goals routes built and hand-tested (add, list with progress, add money, delete). Score engine built with 11 automated tests, plus the score route (saves one row per day in score history) and a score history route, hand-tested.
- 2026-11-05: Score humour lines and tips added. Shared amount and date checks moved into lib/validation.ts and used by the budgets, transactions and goals routes. Backend routes are complete for the first version.
- 2026-11-05: Phase 5 started. Frontend setup, design direction, fonts, API helper, auth context and the Log in and Sign up screen done and tested by hand (signup, login, refresh keeps session, logout).
- 2026-11-05: Added GET /api/summary (balance, this month's income and spending), checked by hand in the browser. Home screen built (balance, month receipt, score card). Empty state checked in the browser.
- 2026-11-07: Transactions screen built (newest 50, add form, delete with a confirm step). Add, list and delete all checked by hand: Home balance, month totals and score matched.
- 2026-11-07: Budgets screen built (set or change a limit, list with spent so far and a bar, delete with a confirm step). Checked by hand: update of an existing category, empty form error, delete, and the Home budget points (30 when within limit, 0 when over, 15 with no budgets).

## Still open (backend)
- Automated route tests (needs a separate test database)
- Editing transactions and budgets (only add and delete exist)
- Month filter for the transactions list (it returns the newest 50 from all months)
- Deploy settings: trust proxy, CSRF review, secure cookies

## Next
Goals screen: add a goal, list with progress, add money, delete. Same pattern as the Budgets screen. Then Can I afford this?