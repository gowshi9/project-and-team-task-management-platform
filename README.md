# TeamFlow - Project and Team Task Management Platform

## Overview
TeamFlow is a web‑based platform that streamlines project and task management for collaborative teams. It offers role‑based access, real‑time updates, and an intuitive UI for administrators, project managers, and team members.

## Tech Stack
- **Frontend**: Next.js (App Router) with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MySQL accessed via Prisma ORM
- **Containerization (optional)**: Docker & Docker‑Compose

## Deployment & Live Demo
- **Live Frontend Application**: [TeamFlow Client](https://project-and-team-task-management-platform-gowshi9s-projects.vercel.app)
- **Live Backend API Service**: [TeamFlow API Server](https://project-and-team-task-management-ylz7.onrender.com)
- **Project Demonstration Video**: [Microsoft OneDrive Screen Recording](https://1drv.ms/v/c/4277e0b4189b75c4/IQDTw9mTj8ziSqOOxfULZhj7AWOUufnKXs11j0Ki4ojQ54o?e=nqTzwJ)

## Key Features by Role
### Administrator
- Manage user accounts and assign roles
- Configure system settings and view access logs
- Deactivate or delete users
### Project Manager
- Create, edit, and archive projects
- Invite team members and define project roles
- Create, assign, prioritize, and track tasks
- View project progress dashboards
### Team Member
- View assigned tasks and project details
- Update task status, add comments, and upload attachments
- Receive real‑time notifications for task updates

## Documentation Index
- [Entity Relationship Diagram (ERD)](TeamFlow-Project-Team-Task-Management-Platform-main/docs/ERD.md)
- [Use Case Diagram](TeamFlow-Project-Team-Task-Management-Platform-main/docs/USE_CASE.md)
- [System Architecture Diagram](TeamFlow-Project-Team-Task-Management-Platform-main/docs/ARCHITECTURE.md)
- [API Documentation](TeamFlow-Project-Team-Task-Management-Platform-main/docs/API.md)
- [Feature Completion Report](TeamFlow-Project-Team-Task-Management-Platform-main/docs/FEATURE_COMPLETION_REPORT.md)
- [CI/CD Workflow Explanation](TeamFlow-Project-Team-Task-Management-Platform-main/docs/CICD.md)
- [AI Tools Usage Disclosure](TeamFlow-Project-Team-Task-Management-Platform-main/docs/AIDisclosure.md)
- [Setup & Run Guide](TeamFlow-Project-Team-Task-Management-Platform-main/docs/SETUP_MYSQL.md)

## Prerequisites & Local Setup
1. Install **Node.js** (v18+) and **npm**.
2. Install **MySQL** (or use the provided Docker‑Compose configuration).
3. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TeamFlow-Project-Team-Task-Management-Platform-main
   ```
4. Copy the example environment file and configure values:
   ```bash
   cp .env.example .env
   ```
   - Set `DATABASE_URL` to your MySQL connection string.
5. Install dependencies:
   ```bash
   npm install
   ```
6. Run database migrations and seed data:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
7. Start the development servers:
   ```bash
   npm run dev
   ```
8. Open `http://localhost:3000` in a browser.

## Demo Account Credentials
| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@example.com | **AdminPass123** |
| Project Manager | pm@example.com | **PmPass123** |
| Team Member | member@example.com | **MemberPass123** |

## AI Tools Assistance Disclosure
This project was developed with assistance from **Antigravity AI** powered by **Google Gemini**. All AI‑generated code has been reviewed and manually integrated to meet project standards.

---

*All documentation adheres to the submission requirements of CyphLab.*
