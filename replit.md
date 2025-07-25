# LocalSkills Job Board - System Overview

## Overview

LocalSkills is a full-stack job board application that connects local job seekers with employers through skills-based matching. The platform features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and in-memory storage for development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with shadcn/ui component library
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state, React Context for authentication
- **Build Tool**: Vite for development and production builds
- **UI Components**: Comprehensive set of accessible components from Radix UI

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api` namespace
- **Development Storage**: In-memory storage implementation
- **Production Storage**: PostgreSQL with Drizzle ORM
- **Authentication**: Password-based with bcrypt hashing

### Data Storage Solutions
- **Development**: MemStorage class providing in-memory data persistence
- **Production**: PostgreSQL database with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Schema Management**: Drizzle migrations in `./migrations` directory
- **Connection**: Environment-based DATABASE_URL configuration

## Key Components

### User Management
- Dual user types: job seekers and employers
- Profile management with skills, experience, and personal information
- Secure authentication with password hashing
- User context provider for authentication state

### Job Management
- Job posting and editing for employers
- Advanced job search with filters (location, skills, job type)
- Skills-based job recommendations
- Job application tracking and status management

### Company Management
- Company profile creation and management
- Company-job relationship management
- Multi-company support for employers

### Messaging System
- Direct messaging between users
- Application-related communication
- Message threading and read status tracking

### Application Workflow
- Job application submission and tracking
- Status progression (applied → under review → interview → offered/rejected)
- Application management for both job seekers and employers

## Data Flow

### Authentication Flow
1. User registration/login through `/api/auth` endpoints
2. Password validation and user creation/verification
3. User data stored in context for application-wide access
4. Protected routes based on authentication status and user type

### Job Discovery Flow
1. Job search with dynamic filtering
2. Skills-based matching algorithm
3. Real-time job recommendations
4. Application submission with status tracking

### Communication Flow
1. Message creation between users
2. Application-based messaging threads
3. Real-time message status updates
4. Conversation history management

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation with Zod integration
- **wouter**: Lightweight React router
- **date-fns**: Date formatting and manipulation
- **@radix-ui/***: Accessible UI primitives
- **class-variance-authority**: Component variant management

### Backend Dependencies
- **drizzle-orm**: TypeScript ORM for PostgreSQL
- **@neondatabase/serverless**: Neon database client
- **bcrypt**: Password hashing and verification
- **express**: Web application framework
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server code

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- In-memory storage for rapid development iteration
- Replit-specific development tools and error handling

### Production Build Process
1. **Frontend**: Vite builds optimized React bundle to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command
4. **Assets**: Static files served from built frontend

### Database Migration Strategy
- Development: `drizzle-kit push` for schema synchronization
- Production: Structured migration files in `./migrations`
- Schema definition in `shared/schema.ts` for type safety
- Environment-based database URL configuration

### Environment Configuration
- `NODE_ENV` for environment detection
- `DATABASE_URL` for PostgreSQL connection
- Replit-specific environment variables for development features
- Type-safe environment variable validation

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and a focus on developer experience and maintainability.