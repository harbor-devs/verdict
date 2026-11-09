# VERDICT

A personal-finance app that answers one question before you spend: **can I afford this?**

VERDICT tracks your income, spending, budgets and savings goals, then gives every purchase a clear verdict: **YES**, **RISKY** or **NO**. The verdict comes from a deterministic rules engine, not guesswork, and it is delivered in a witty, friend-style voice. Default currency is PKR.

## Features

- **Can I afford this?** Enter a price (and optionally a category) and get a YES, RISKY or NO verdict with the reasons behind it, including the category budget when one exists.
- **Transactions:** add, list and delete income and expenses.
- **Budgets:** set monthly limits per category and see spending against each limit.
- **Savings goals:** create goals with an optional target date, add money and track progress.
- **Financial score:** a daily score with history, tips and personality-driven feedback.
- **Home dashboard:** balance, this month's income and spending, and the current score.
- **Accounts:** sign up, log in and log out with secure cookie sessions.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL |
| Validation | Zod |
| Testing | Vitest |

## Architecture

```
verdict/
├── client/          React single-page app
│   └── src/
│       ├── api/         API client and shared types
│       ├── components/  UI components
│       ├── lib/         Auth context and helpers
│       └── pages/       Screens
└── server/          Express REST API
    ├── db/migrations/   SQL migrations
    └── src/
        ├── auth/        Password hashing and sessions
        ├── engine/      Verdict and score engines (pure, unit tested)
        ├── lib/         Money, validation and HTTP helpers
        └── routes/      API routes
```

The verdict and score engines are pure functions with no database access, which keeps the core logic easy to test.

## Security

- Passwords hashed with scrypt
- Session tokens stored only as hashes in the database
- Session cookies are `httpOnly`, `SameSite=Lax`, and `Secure` in production
- Request validation with Zod on every write route
- Helmet security headers, CORS restricted to the client origin, and rate limiting
- Secrets kept in environment variables, never committed

## Money handling

Amounts are stored in PostgreSQL as `NUMERIC(14,2)` rupees. The engines work in whole paisa (integers) to avoid floating point rounding errors.

## Getting started

### Requirements

- Node.js 24 or newer
- PostgreSQL

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Fill in `.env` with your database details, then create the tables and start the API:

```bash
npm run migrate
npm run dev
```

The API runs on `http://localhost:4000`.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## Environment variables

Set in `server/.env`:

| Variable | Description |
|---|---|
| `PORT` | API port (default `4000`) |
| `DATABASE_URL` | Full PostgreSQL connection string. If set, it is used instead of the `DB_*` values |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Local database connection |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS (default `http://localhost:5173`) |

Optional in the client:

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL. Defaults to `http://localhost:4000` in development and the same origin in production |

## Scripts

**Server:** `npm run dev` (watch mode), `npm run migrate`, `npm test`, `npm run build`, `npm start`

**Client:** `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`

## Testing

```bash
cd server
npm test
```

Unit tests cover the verdict engine, the score engine, the voice lines and the money helpers.

## Deployment

- **Database:** Neon (serverless PostgreSQL)
- **API:** Render web service, root directory `server`, build `npm install && npm run build`, start `npm start`
- **Frontend:** Netlify, base directory `client`. API requests to `/api/*` are proxied to the backend so the browser sees a single origin

## Author

Built by Abdullah Saghir under [Harbor](https://github.com/harbor-devs).