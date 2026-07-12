import { Role } from "@prisma/client";
import { AuthUser } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export function isAdmin(user: AuthUser) {
  return user.role === Role.ADMIN;
}

export function isProjectManager(user: AuthUser) {
  return user.role === Role.PROJECT_MANAGER;
}

export async function assertProjectAccess(
  user: AuthUser,
  projectId: string,
  options: { requireManage?: boolean } = {}
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (isAdmin(user)) {
    return project;
  }

  const isCreator = project.createdById === user.id;
  const isMember = project.members.some((m) => m.userId === user.id);

  if (options.requireManage) {
    if (user.role === Role.PROJECT_MANAGER && isCreator) {
      return project;
    }
    throw new AppError("Forbidden: cannot manage this project", 403);
  }

  if (isCreator || isMember) {
    return project;
  }

  throw new AppError("Forbidden: no access to this project", 403);
}

export async function logActivity(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  projectId?: string | null;
  taskId?: string | null;
  details?: string;
}) {
  await prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      projectId: params.projectId ?? undefined,
      taskId: params.taskId ?? undefined,
      details: params.details,
    },
  });
}

export function publicUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash: _, ...rest } = user;
  return rest;
}
