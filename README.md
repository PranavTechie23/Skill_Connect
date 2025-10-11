# SkillConnect

![SkillConnect Logo](/client/public/images/logo.png)

SkillConnect is a modern, full-stack job platform designed to connect skilled professionals with local employers. Our platform focuses on skills-based matching to ensure the perfect fit for both job seekers and companies.

## ✨ Features

- **Dual User Roles:** Separate registration and dashboard experiences for **Professionals** and **Employers**.
- **Skills-Based Matching:** An intelligent algorithm that matches jobs to candidates based on their skill set.
- **Dynamic Multi-Step Signup:** A seamless, multi-step registration process with dynamic fields based on user type.
- **Comprehensive Dashboards:** 
  - **Employee Dashboard:** Track applications, discover recommended jobs, and manage your profile.
  - **Employer Dashboard:** Post new jobs, manage listings, and view candidates.
- **Job Listings & Search:** Advanced search and filtering capabilities for job seekers.
- **Secure Authentication:** Robust authentication with password hashing and session management.
- **RESTful API:** A well-structured backend API built with Express and Node.js.

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
