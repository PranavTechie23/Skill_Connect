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

### Advanced Features

- ⚡ **Real-time Updates** - Live application status changes and Socket.io messaging
- ☁️ **Cloud Storage** - Cloudinary integration for scalable avatar and resume storage
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
├── Zustand            - State management
├── React Query        - Data fetching & caching
├── Radix UI           - Accessible component primitives
├── Framer Motion/GSAP - Animations & micro-interactions
├── Three.js           - 3D elements
└── Lucide React       - Icon library
```

### Backend
```
├── Node.js            - Runtime environment
├── Express.js         - Web framework
├── TypeScript         - Type safety
├── PostgreSQL         - Database
├── Drizzle ORM        - Type-safe database ORM
├── Express Session    - Session management
├── connect-pg-simple  - PostgreSQL session store
├── Passport.js        - Authentication middleware
├── Zod                - Schema validation
├── bcrypt             - Password hashing
├── Socket.io          - Real-time bidirectional event-based communication
├── Cloudinary         - Cloud image and document storage
├── Helmet             - HTTP response security headers
└── Morgan             - HTTP request logging
```

### Security
```
├── RBAC              - Role-based access control
├── RLS               - Row-level security
├── pgcrypto          - Database encryption
├── SSL/TLS           - Secure connections
└── CORS              - Cross-origin resource sharing
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
*(Note: This project uses NPM Workspaces. Always run `npm install` from the root directory, which will automatically handle both `client/` and `server/` dependencies.)*

```bash
npm install
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
│   │   ├── contexts/      # React contexts (Auth, Language, etc.)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries and API services
│   │   ├── pages/         # Page components (admin, employee, employer)
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Backend application
│   ├── src/
│   │   ├── ai/           # AI Assistant and guardrails
│   │   ├── routes/       # API route handlers
│   │   ├── routes.ts     # Main router configuration
│   │   ├── storage.ts    # Database storage interfaces
│   │   ├── db.ts         # PostgreSQL + Drizzle connection
│   │   └── index.ts      # Server entry point
│   └── package.json
│
├── shared/                # Shared types/schema (Drizzle)
├── drizzle/               # Database migrations
└── README.md
```



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
- Real-time messaging functionality (Socket.io)
- Cloudinary Integration for file uploads
- Security headers and logging (Helmet & Morgan)
- Admin dashboard
- Responsive UI/UX
- **Advanced Search with AI Semantic matching**
- **AI Resume Parsing and Auto-fill extraction**
- **Agentic Workflows (Recruiter, Support, Admin bots)**

### In Progress 🚧
- Email notifications
- Mobile application
- Enhanced messaging with file attachments

### Planned 📋
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



## 🌐 Live Demo

https://skill-connect-alpha.vercel.app/
-
<div align="center">

**Made by the SkillConnect team**

*Empowering Local Employment Through Technology*


</div>
