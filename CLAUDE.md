# CLAUDE.md

Guidance for AI coding assistants working in this repository. Read README.md for the project overview and ROADMAP in PROJECT.md for current status.

## Stack

- Client: React 19, TypeScript, Vite, Tailwind CSS v4, React Router (in `client`)
- Server: Express 5, TypeScript, PostgreSQL via `pg`, Zod validation (in `server`)
- Tests: Vitest (server)

## Conventions

- Use Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- Keep the verdict and score engines in `server/src/engine` pure. No database or HTTP access inside them.
- Validate every request body with Zod before it reaches the database.
- API errors use one shape: `{ error: { code, message, fields? } }`.
- Categories are stored in lowercase.
- Never use em dashes in code, comments or docs.

## Money

- Database amounts are `NUMERIC(14,2)` rupees.
- The engines work in whole paisa (integers).
- Always convert with the helpers in `server/src/lib/money.ts`. Never use floating point math on money.

## Database

- Schema changes go in a new numbered file in `server/db/migrations`. Never edit a migration that has already been applied.
- Run migrations with `npm run migrate` from `server`.

## Security

- Secrets live in `.env` files, which are git-ignored. Never commit them or print them.
- Before committing, check that no `.env` file or `node_modules` folder is staged.
- Session cookies must stay `httpOnly`, `SameSite=Lax`, and `Secure` in production.

## Honesty

- Never present mock data or unfinished features as real.