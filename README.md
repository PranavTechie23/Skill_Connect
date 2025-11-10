# 🎯 Skills Connect Job Board

> A community-focused web platform bridging the gap between local job seekers and employers through skill-based and location-based hiring.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Video Demo](#-video-demo)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Skills Connect Job Board** is a digital employment platform designed to address local hiring challenges by connecting job seekers with nearby employers based on specific skills and geographic proximity. The platform emphasizes simplicity, speed, and accessibility while supporting real-world community needs.

### 🎯 Key Objectives

- **For Employers**: Post, update, and manage job openings seamlessly
- **For Job Seekers**: Search, apply, and track applications with ease
- **For Community**: Enable faster hiring and quicker access to opportunities

### 🌍 SDG Alignment

This project aligns with **UN SDG 8 — Decent Work and Economic Growth**, promoting sustained economic growth, productive employment, and equal access to job opportunities.

---

## ✨ Features

### Core Functionality

- 🔐 **Secure Authentication** - Role-based access control (RBAC) with password hashing
- 💼 **Job Management** - Post, edit, and manage job listings
- 🔍 **Smart Search** - Filter jobs by location, skills, and job type
- 📝 **Application Tracking** - Real-time application status updates
- 💬 **Messaging System** - In-app communication between employers and candidates
- 📊 **Admin Dashboard** - Comprehensive platform management and analytics
- 🏢 **Company Profiles** - Detailed employer information and branding
- 📈 **Success Stories** - Showcase platform impact and user testimonials

### Advanced Features

- ⚡ **Real-time Updates** - Live application status changes
- 📱 **Responsive Design** - Mobile-first, accessible on all devices
- 🔒 **Row-Level Security** - PostgreSQL RLS for data protection
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

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/___________.git
cd ______________
```

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

 **Start Development Servers**

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

6. **Access the application**
```
Frontend: http://localhost:5173
Backend:  http://localhost:5002
```


## 📁 Project Structure

```
skillsconnect-job-board/
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
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── db/           # Database connection & queries
│   │   ├── types/        # TypeScript interfaces
│   │   ├── utils/        # Helper functions
│   │   └── index.ts      # Server entry point
│   └── package.json
│
├── docs/                  # Documentation
│   ├── API.md            # API documentation
│   ├── DEPLOYMENT.md     # Deployment guide
│   └── SECURITY.md       # Security guidelines
│
└── README.md
```

---

## 🔒 Security Features

### Authentication & Authorization
- ✅ Password hashing using bcrypt
- ✅ Session-based authentication with PostgreSQL store
- ✅ Role-based access control (Admin, Employer, Job Seeker)
- ✅ HTTP-only cookies for session management

### Database Security
- ✅ Row-Level Security (RLS) policies
- ✅ pgcrypto encryption for sensitive data
- ✅ Prepared statements to prevent SQL injection
- ✅ SSL/TLS connections in production

### Application Security
- ✅ CORS configuration
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ Secure headers (helmet.js)
- ✅ Environment variable protection

---

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
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

For detailed API documentation, see [API.md](docs/API.md)

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd client
vercel --prod
```

### Backend (Your preferred platform)

```bash
cd server
npm run build
npm start
```

### Database (NeonDB)

1. Create a NeonDB account
2. Create a new database
3. Update `DATABASE_URL` in environment variables
4. Run migrations

For detailed deployment instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md)

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

- PICT administration for providing resources and opportunities
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

## � Video Demo

Check out the Skills Connect Job Board in action!
🎥 [Watch SkillConnect Demo](https://drive.google.com/file/d/1yQk2p9alTo18dxsHKmT85fsCKa4R9p6W/view?usp=drive_link)


---

## �🌐 Live Demo

**Coming Soon!** 

Stay tuned for the live deployment link.

---

<div align="center">

**Made with ❤️ by me**

*Empowering Local Employment Through Technology*

[Report Bug](https://github.com/yourusername/skillsconnect-job-board/issues) · [Request Feature](https://github.com/yourusername/skillsconnect-job-board/issues)

</div>
