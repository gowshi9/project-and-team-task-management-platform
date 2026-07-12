# API Documentation

## Authentication
- **POST** `/api/auth/register`
  - Request: `{ "name": "string", "email": "string", "password": "string" }`
  - Response: `{ "user": {"id":"string","email":"string","role":"ADMIN|PROJECT_MANAGER|TEAM_MEMBER"}, "token": "jwt" }`
- **POST** `/api/auth/login`
  - Request: `{ "email": "string", "password": "string" }`
  - Response: `{ "token": "jwt" }`

## Users
- **GET** `/api/users/me`
  - Auth: Bearer token
  - Response: user profile
- **GET** `/api/users`
  - Admin only, list all users

## Projects
- **POST** `/api/projects`
  - Auth: PM or Admin
  - Request: `{ "name": "string", "description": "string?" }`
  - Response: created project
- **GET** `/api/projects`
  - Auth: any logged‑in user, returns projects member belongs to
- **GET** `/api/projects/:id`
- **PUT** `/api/projects/:id`
  - PM/Admin only, update details
- **DELETE** `/api/projects/:id`
  - Admin only

## Project Membership
- **POST** `/api/projects/:id/members`
  - PM/Admin, body `{ "userId": "string", "role": "PROJECT_MANAGER|TEAM_MEMBER" }`
- **DELETE** `/api/projects/:id/members/:userId`

## Tasks
- **POST** `/api/projects/:projectId/tasks`
  - PM/Admin, body `{ "title":"string","description":"string?","assigneeId":"string?" }`
- **GET** `/api/projects/:projectId/tasks`
  - Returns tasks for the project
- **GET** `/api/tasks/:id`
- **PUT** `/api/tasks/:id`
  - Assignee or PM can update status, priority, progress
- **DELETE** `/api/tasks/:id`
  - Admin/PM only

## Comments
- **POST** `/api/tasks/:taskId/comments`
  - Body `{ "body":"string" }`
- **GET** `/api/tasks/:taskId/comments`

All endpoints return JSON and use standard HTTP status codes. Errors include `{ "error": "message" }`.
