export type Role = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  joinedAt: string;
  user: Pick<User, "id" | "name" | "email" | "role" | "status">;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: Pick<User, "id" | "name" | "email" | "role">;
  members?: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number };
  activityLogs?: ActivityLog[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, "id" | "name" | "email" | "role"> | null;
  project?: Pick<Project, "id" | "name" | "status">;
  comments?: Comment[];
  activityLogs?: ActivityLog[];
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author?: Pick<User, "id" | "name" | "email">;
}

export interface ActivityLog {
  id: string;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | null;
  createdAt: string;
  user?: Pick<User, "id" | "name">;
  project?: Pick<Project, "id" | "name"> | null;
  task?: Pick<Task, "id" | "title"> | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  details?: unknown;
}
