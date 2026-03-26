# SkillConnect — Job Board + Hiring Workflows

SkillConnect is a role-based hiring platform that connects **Professionals (job seekers)**, **Employers**, and **Admins** with a modern workflow: discover jobs, apply quickly, manage listings/applications, and keep the ecosystem trustworthy.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [API Notes](#-api-notes)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

SkillConnect is a digital employment platform designed to reduce hiring friction:
- **Professionals** discover and apply to jobs faster (including quick apply).
- **Employers** post and manage jobs and review candidates.
- **Admins** help maintain trust and quality of the platform through governance workflows.

### 🎯 Key Objectives

- **For Employers**: Post, update, and manage job openings seamlessly
- **For Job Seekers**: Search, apply, and track applications with ease
- **For Community**: Enable faster hiring and quicker access to opportunities

### 🌍 SDG Alignment

This project aligns with **UN SDG 8 — Decent Work and Economic Growth**, promoting sustained economic growth, productive employment, and equal access to job opportunities.

---

## ✨ Features

### Core Functionality

- 🔐 **Authentication** - Session-based auth + role-based access patterns
- 💼 **Job Management** - Post, edit, and manage job listings
- 🔍 **Smart Search** - Filter jobs by location, skills, and job type
- 📝 **Application Tracking** - Real-time application status updates
- 💬 **Messaging System** - In-app communication between employers and candidates
- 📊 **Admin Dashboard** - Comprehensive platform management and analytics
- 🏢 **Company Profiles** - Detailed employer information and branding
- 📈 **Success Stories** - Showcase platform impact and user testimonials
- 🤖 **In-app Support Chatbot** - `/api/assistant/chat` endpoint (Gemini API key required)
- 🌐 **Multilingual UI** - Locale files under `client/src/locales/`

### Advanced Features

- ⚡ **Real-time Updates** - Live application status changes
- 📱 **Responsive Design** - Mobile-first, accessible on all devices
- 🎨 **Modern UI/UX** - Clean, intuitive interface with TailwindCSS
- 📧 **Email Notifications** - Automated alerts for applications and updates

---

## 🛠️ Tech Stack

### Frontend
```
├── React 18.x          - UI library
├── TypeScript          - Type safety
├── TailwindCSS         - Utility-first CSS
├── Vite               - Build tool & dev server
├── React Router       - Client-side routing
└── Lucide React       - Icon library
```

### Backend
```
├── Node.js            - Runtime environment
├── Express.js         - Web framework
├── TypeScript         - Type safety
├── PostgreSQL         - Database
├── Express Session    - Session management
├── connect-pg-simple  - PostgreSQL session store
└── bcrypt            - Password hashing
```

### Security
```
├── RBAC              - Role-based access control
├── RLS               - Row-level security
├── pgcrypto          - Database encryption
├── SSL/TLS           - Secure connections
└── CORS              - Cross-origin resource sharing
```

### Deployment
```
├── Vercel            - Frontend hosting
├── NeonDB            - PostgreSQL hosting
└── Git/GitHub        - Version control
```

---

## 🚀 Getting Started

### Prerequisites

```bash
- Node.js >= 18.x
- PostgreSQL >= 15.x
- npm or yarn
- Git
```

### Installation

1. **Install all dependencies**

```bash
npm run install:all
```

2. **Configure environment variables** (see [Environment Variables](#-environment-variables))

3. **Run in development**

```bash
# from repo root
npm run dev
```

4. **Access**

```text
Client: http://localhost:5173
Server: http://localhost:5002
```


## 📁 Project Structure

```
CEP_Project/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Backend application
│   ├── src/
│   │   ├── routes.ts     # API route handlers (incl. assistant endpoint)
│   │   ├── db.ts         # PostgreSQL + Drizzle connection
│   │   └── index.ts      # Server entry point
│   └── package.json
│
├── shared/                # Shared types/schema (Drizzle)
└── README.md
```

---

## 🔐 Environment Variables

Create `server/.env` (server reads it from `server/.env`).

```env
# Server
PORT=5002
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
SESSION_SECRET=replace-me-with-a-long-random-string

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5002/api/auth/google/callback

# AI Assistant (required for chatbot)
GEMINI_API_KEY=...
```

Notes:
- The AI assistant endpoint (`POST /api/assistant/chat`) returns an error if `GEMINI_API_KEY` is not set.
- In development, the client proxies `/api` to the server (see `client/vite.config.ts`).

---

## 📚 API Notes

### Common endpoints (non-exhaustive)

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/assistant/chat
```

### Job Endpoints

```http
GET    /api/jobs              # Get all jobs (with filters)
GET    /api/jobs/:id          # Get job by ID
POST   /api/jobs              # Create job (employer only)
PUT    /api/jobs/:id          # Update job (employer only)
DELETE /api/jobs/:id          # Delete job (employer only)
```

### Application Endpoints

```http
GET    /api/applications             # Get user applications
POST   /api/applications             # Submit application
PUT    /api/applications/:id/status  # Update status (employer)
```

### Admin Endpoints

```http
GET    /api/admin/stats       # Platform statistics
GET    /api/admin/users       # All users
GET    /api/admin/jobs        # All jobs
GET    /api/admin/companies   # All companies
GET    /api/admin/approvals   # Pending approvals
```

### Messaging Endpoints

```http
GET    /api/messages          # Get conversations
POST   /api/messages          # Send message
GET    /api/messages/:userId  # Get conversation with user
```

Tip: during development, call API endpoints via the client origin (`http://localhost:5173/api/...`) so cookies/sessions behave consistently.

---

## 🚢 Deployment

### Frontend (Vercel)

Deploy the `client/` project on Vercel:
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Install command**: `npm install`

### Backend (Your preferred platform)

```bash
cd server
npm start
```

### Database (NeonDB)

1. Create a NeonDB account
2. Create a new database
3. Update `DATABASE_URL` in environment variables
4. Run migrations (if your workflow uses Drizzle migrations)

For Vercel, remember:
- Vercel hosts the frontend; your server must be deployed separately (Render/Railway/Fly/VM/etc.) unless you convert it to serverless.
- Set the production API base URL in the client if required by your deployment strategy.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Write comments for complex logic
- Maintain consistent code formatting (Prettier)
- Write tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Local business community for insights and feedback
- All participants and volunteers who contributed to the project

---


## 🗺️ Roadmap

### Completed ✅
- User authentication and authorization
- Job posting and management
- Application tracking system
- Basic messaging functionality
- Admin dashboard
- Responsive UI/UX

### In Progress 🚧
- Advanced search with AI recommendations
- Email notifications
- Mobile application
- Enhanced messaging with file attachments

### Planned 📋
- Resume parsing and auto-fill
- Video interviews
- Skill assessment tests
- Employer verification system
- Freelance/gig work module
- Integration with college placement cells

---

## 📊 Project Statistics

- **Lines of Code**: ~15,000+
- **Components**: 50+
- **API Endpoints**: 30+
- **Database Tables**: 10+
- **Active Features**: 20+

---

## 🎥 Video Demo

Check out the Skills Connect Job Board in action!
🎥 [Watch SkillConnect Demo](https://drive.google.com/file/d/1yQk2p9alTo18dxsHKmT85fsCKa4R9p6W/view?usp=drive_link)


---

## 🌐 Live Demo


Stay tuned for the live deployment link.
---

<div align="center">

**Made by the SkillConnect team**

*Empowering Local Employment Through Technology*

[Report Bug](https://github.com/yourusername/skillsconnect-job-board/issues) · [Request Feature](https://github.com/yourusername/skillsconnect-job-board/issues)

</div>
