# Stable Manager

Production-ready ranch web app for tracking riding lessons and boarding fees. Built with Next.js App Router, Prisma, and Postgres.

## Features
- Monthly dashboard with totals and projected revenue
- Rider input screen with auto-calculation and rate overrides
- Boarder batch billing with one-click monthly commit
- NextAuth authentication (email/password, optional Google)

## Tech Stack
- Next.js App Router
- Prisma ORM
- Postgres (Neon or local)
- NextAuth
- Tailwind CSS

## Requirements
- Node.js and npm
- Postgres database (local or hosted)

## Local Setup
1. Create `.env` and set:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (random 32+ chars)
   - `NEXTAUTH_URL` (e.g. `http://localhost:3000`)
   - Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
2. Install dependencies and run:
   - `npm install`
   - `npm run dev`

## Scripts
- `npm run dev` — start local dev server
- `npm run build` — generate Prisma client, build app
- `npm run start` — start production server
- `npm run lint` — run Next.js lint
- `npm run prisma:migrate` — run Prisma dev migrations
- `npm run prisma:migrate:deploy` — run Prisma deploy migrations
- `npm run prisma:studio` — open Prisma Studio

## Database
- Local development can use a local Postgres instance.
- Hosted Postgres (Neon/Vercel) works by setting `DATABASE_URL`.
- Build step runs `prisma generate && next build`.

## Deployment (Vercel + Neon)
1. Create a Postgres database in Vercel Storage (Neon).
2. Connect it to the Vercel project.
3. Ensure `DATABASE_URL` matches the provided `POSTGRES_URL`.
4. Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in Vercel env vars.
5. Deploy.

## Notes
- For production migrations, use `prisma migrate deploy`.
- The first admin account is created at `/register`.
