# CEP_Project
Local Skill Connect
# Local Skills Job Board

A modern job marketplace connecting local talent and employers with skill-based matching, application tracking, and in-app messaging.

## Stack
- Frontend: React, TypeScript, TailwindCSS, Radix UI
- Backend: Node.js, Express
- Database: PostgreSQL via Drizzle ORM

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## Setup
1) Install dependencies:
```bash
npm install
```
2) Create `.env` in the project root:
```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/graphicgenie
# For managed Postgres with SSL:
# PGSSLMODE=require
# DATABASE_SSL=true
```
3) Create the database:
```sql
CREATE DATABASE graphicgenie;
```
4) Generate and push schema:
```bash
npm run db:generate
npm run db:push
```

## Development
```bash
npm run dev
```
- App served at http://127.0.0.1:5000

## Production
```bash
npm run build
npm start
```

## Deploy
- Recommended single deploy (Railway/Render/Fly):
  - Set `DATABASE_URL` (and `PGSSLMODE=require` if needed)
  - Expose port 5000
- Split deploy (Vercel/Netlify + external API):
  - Build client: `npm run build`, deploy `server/public` as static
  - Deploy API to Railway/Render with `npm start`
  - Optionally wire a `VITE_API_URL` for the client; I can add this if requested

## Security Notes
- Passwords are hashed with bcrypt
- Optional Postgres SSL via `PGSSLMODE=require` or `DATABASE_SSL=true`
- You can add a migration enabling `pgcrypto` and RLS for stricter isolation. Create `migrations/0001_security.sql` with policies and run `npm run db:push`.

## Scripts
- `npm run dev` – dev server
- `npm run build` – build client and bundle server
- `npm start` – start production server
- `npm run db:generate` – generate migrations
- `npm run db:push` – push schema
 68b2fa9 (Normalize line endings)
