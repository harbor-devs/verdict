- Screens: Sign up and Log in, Home, Transactions, Budgets, Goals, Can I afford this? (at /afford). All done and checked by hand.
- Shared navigation bar (components/NavBar.tsx) shows on every screen when logged in. The "Back to Home" links on pages stay until the design pass.

## Status log
- 2026-11-04: repo created under harbor-devs, Git set up, docs added, Express server with health route.
- 2026-11-04: Phase 2 done (PostgreSQL schema and migrations). Phase 3 done: signup, login, logout, /me, scrypt password hashing, cookie sessions (token hash stored in the database), zod validation, helmet, CORS, rate limiting. Failure cases tested by hand, no automated tests yet.
- 2026-11-04: Verdict engine built (YES, RISKY, NO with a 20 percent buffer rule), humour voice lines, exact money helpers, 16 automated tests. API routes built and hand-tested: transactions (add, list, delete), budgets (set, list, delete), and the "can I afford this?" verdict route.
- 2026-11-05: Savings goals routes built and hand-tested (add, list with progress, add money, delete). Score engine built with 11 automated tests, plus the score route (saves one row per day in score history) and a score history route, hand-tested.
- 2026-11-05: Score humour lines and tips added. Shared amount and date checks moved into lib/validation.ts and used by the budgets, transactions and goals routes. Backend routes are complete for the first version.
- 2026-11-05: Phase 5 started. Frontend setup, design direction, fonts, API helper, auth context and the Log in and Sign up screen done and tested by hand (signup, login, refresh keeps session, logout).
- 2026-11-05: Added GET /api/summary (balance, this month's income and spending), checked by hand in the browser. Home screen built (balance, month receipt, score card). Empty state checked in the browser.
- 2026-11-07: Transactions screen built (newest 50, add form, delete with a confirm step). Add, list and delete all checked by hand: Home balance, month totals and score matched.
- 2026-11-07: Budgets screen built (set or change a limit, list with spent so far and a bar, delete with a confirm step). Checked by hand, including the Home budget points.
- 2026-11-07: Goals screen built (add a goal with optional target date, progress bar, add money per goal, delete with a confirm step). Progress, remaining and reached come from the server. Fixed a file name casing problem (GoalForm.tsx) so it also works on Linux for deploy.
- 2026-11-07: Can I afford this? screen built (price and optional category in, stamp and voice line out, receipt rows, category budget when one exists). Uses the real POST /api/verdict route and saves nothing.
- 2026-11-07: Shared navigation bar added. All Phase 5 screens are now reachable from it.

## Still open (backend)
- Automated route tests (needs a separate test database)
- Editing transactions and budgets (only add and delete exist)
- Month filter for the transactions list (it returns the newest 50 from all months)
- Deploy settings: trust proxy, CSRF review, secure cookies

## Next
One unified design pass across all screens using real UI references (not page by page). Then Phase 6: deploy.