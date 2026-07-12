import type { Role, TaskPriority, TaskStatus } from "./types";

export function roleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "PROJECT_MANAGER":
      return "Project Manager";
    case "TEAM_MEMBER":
      return "Team Member";
  }
}

export function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function priorityClass(priority: TaskPriority) {
  switch (priority) {
    case "URGENT":
      return "badge-urgent";
    case "HIGH":
      return "badge-high";
    case "MEDIUM":
      return "badge-medium";
    default:
      return "badge-low";
  }
}

export function taskStatusClass(status: TaskStatus) {
  switch (status) {
    case "DONE":
      return "badge-done";
    case "IN_PROGRESS":
      return "badge-progress";
    case "REVIEW":
      return "badge-review";
    default:
      return "badge-todo";
  }
}
