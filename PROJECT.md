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

## Status log
- 2026-11-04: repo created under harbor-devs, Git set up, docs added, Express server with health route.
