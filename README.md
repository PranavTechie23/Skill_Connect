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

## 🛠️ Tech Stack

### Frontend

- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with shadcn/ui
- **UI Components:** Radix UI
- **Animations:** Framer Motion
- **Routing:** React Router

### Backend

- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** bcrypt for password hashing, express-session for session management
- **Validation:** Zod

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/)

### 1. Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies for all workspaces:**
    ```sh
    npm install
    cd client && npm install
    cd ../server && npm install
    ```

### 2. Database Setup

1.  **Start your PostgreSQL server.**

2.  **Create a new database.** For example, `skillconnect`.

3.  **Configure the database connection:**
    Create a `.env` file in the `server` directory and add your database connection string:
    ```env
    DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>"
    ```
    Example:
    ```env
    DATABASE_URL="postgresql://user:pass@localhost:5432/skillconnect"
    ```

4.  **Run database migrations:**
    The project uses Drizzle ORM for database management. Run the following command from the **root** directory to apply the schema changes to your database:
    ```sh
    npm run db:push
    ```
    *Note: `db:push` is great for development. For production, you might want to use `db:generate` and `db:migrate`.*

### 3. Running the Application

1.  **Start the backend server:**
    From the **root** directory:
    ```sh
    npm run dev:server
    ```
    The server will start on the port configured in `server/src/index.ts` (e.g., 3000).

2.  **Start the frontend client:**
    In a **new terminal**, from the **root** directory:
    ```sh
    npm run dev:client
    ```
    The client will start on `http://localhost:5173` (or another port if 5173 is busy).

3.  **Open the application:**
    Open your browser and navigate to the address provided by the Vite development server.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.