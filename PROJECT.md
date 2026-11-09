# Roadmap

## Done

### Backend
- PostgreSQL schema and migrations
- Authentication: signup, login, logout, current user, scrypt hashing, hashed session tokens in cookies
- Security: Zod validation, Helmet, CORS, rate limiting
- Verdict engine (YES, RISKY, NO with a 20 percent buffer rule) and personality voice lines
- Exact money helpers working in paisa
- Routes: transactions, budgets, savings goals, verdict, score with daily history, summary
- Unit tests for the engines and money helpers

### Frontend
- Screens: Sign up and Log in, Home, Transactions, Budgets, Goals, Can I afford this?
- Shared navigation bar
- Unified "case file" visual design

### Deployment
- Database on Neon
- API on Render
- Same-origin `/api` proxy configuration for the frontend

## Next

- Frontend deployment
- Wake-up handling for the free-tier API cold start (friendly loading message and retry)
- Rewrite README with live link and screenshots
- CSRF review
- Automated route tests against a separate test database
- Editing transactions and budgets (currently add and delete only)
- Month filter for the transactions list

## Changelog

- **2026-11-04:** Repository, Express server, database schema, authentication, verdict engine, core API routes
- **2026-11-05:** Savings goals, score engine and history, summary route, frontend setup, auth screens, Home screen
- **2026-11-07:** Transactions, Budgets, Goals and "Can I afford this?" screens, shared navigation
- **2026-11-08:** Unified visual design across all screens
- **2026-11-09:** Hosted database (Neon), API deployed to Render, proxy setup for the frontend