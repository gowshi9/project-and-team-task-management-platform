import { Router, Request, Response, NextFunction } from "express";
import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  assertProjectAccess,
  isAdmin,
  isProjectManager,
  logActivity,
} from "../lib/rbac";
import { authenticate, authorize } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  createCommentSchema,
  createTaskSchema,
  updateTaskSchema,
} from "../validators/schemas";

const router = Router();

router.use(authenticate);

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true, role: true } },
  project: { select: { id: true, name: true, status: true } },
  _count: { select: { comments: true } },
} as const;

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { projectId, status, assigneeId, priority, q } = req.query;

    const filters: Record<string, unknown> = {};
    if (typeof projectId === "string") filters.projectId = projectId;
    if (typeof status === "string") filters.status = status;
    if (typeof assigneeId === "string") filters.assigneeId = assigneeId;
    if (typeof priority === "string") filters.priority = priority;
    if (typeof q === "string" && q.trim()) {
      filters.OR = [
        { title: { contains: q.trim() } },
        { description: { contains: q.trim() } },
      ];
    }

    let where: Record<string, unknown> = { ...filters };

    if (!isAdmin(user)) {
      if (user.role === Role.TEAM_MEMBER) {
        where = {
          AND: [
            filters,
            {
              OR: [
                { assigneeId: user.id },
                { project: { members: { some: { userId: user.id } } } },
              ],
            },
          ],
        };
      } else if (isProjectManager(user)) {
        where = {
          AND: [
            filters,
            {
              project: {
                OR: [
                  { createdById: user.id },
                  { members: { some: { userId: user.id } } },
                ],
              },
            },
          ],
        };
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });

    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        ...taskInclude,
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        activityLogs: {
          take: 15,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!task) throw new AppError("Task not found", 404);
    await assertProjectAccess(req.user!, task.projectId);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createTaskSchema.parse(req.body);
      await assertProjectAccess(req.user!, input.projectId, { requireManage: true });

      if (input.assigneeId) {
        const member = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: input.projectId,
              userId: input.assigneeId,
            },
          },
        });
        if (!member) {
          throw new AppError("Assignee must be a project member", 400);
        }
      }

      const progress =
        input.status === TaskStatus.DONE
          ? 100
          : (input.progress ?? 0);

      const task = await prisma.task.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description ?? undefined,
          status: input.status,
          priority: input.priority,
          progress,
          assigneeId: input.assigneeId ?? undefined,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
        include: taskInclude,
      });

      await logActivity({
        userId: req.user!.id,
        projectId: task.projectId,
        taskId: task.id,
        action: "TASK_CREATED",
        entityType: "TASK",
        entityId: task.id,
        details: `Created task "${task.title}"`,
      });

      res.status(201).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("Task not found", 404);

    const user = req.user!;
    const input = updateTaskSchema.parse(req.body);

    let canManage = false;
    if (isAdmin(user)) {
      canManage = true;
    } else if (isProjectManager(user)) {
      await assertProjectAccess(user, existing.projectId, { requireManage: true });
      canManage = true;
    }

    if (!canManage) {
      // Team members may only update status/progress on their assigned tasks
      if (existing.assigneeId !== user.id) {
        throw new AppError("Forbidden: you can only update your assigned tasks", 403);
      }
      await assertProjectAccess(user, existing.projectId);

      const allowedKeys = ["status", "progress"];
      const keys = Object.keys(input);
      if (keys.some((k) => !allowedKeys.includes(k))) {
        throw new AppError(
          "Team members may only update status and progress",
          403
        );
      }
    } else if (input.assigneeId) {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: existing.projectId,
            userId: input.assigneeId,
          },
        },
      });
      if (!member) {
        throw new AppError("Assignee must be a project member", 400);
      }
    }

    let progress = input.progress;
    if (input.status === TaskStatus.DONE && progress === undefined) {
      progress = 100;
    }
    if (input.status === TaskStatus.TODO && progress === undefined) {
      progress = 0;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...input,
        progress,
        dueDate:
          input.dueDate === undefined
            ? undefined
            : input.dueDate
              ? new Date(input.dueDate)
              : null,
      },
      include: taskInclude,
    });

    await logActivity({
      userId: user.id,
      projectId: task.projectId,
      taskId: task.id,
      action: "TASK_UPDATED",
      entityType: "TASK",
      entityId: task.id,
      details: `Updated task "${task.title}"`,
    });

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/:id",
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError("Task not found", 404);
      await assertProjectAccess(req.user!, existing.projectId, { requireManage: true });
      await prisma.task.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Task deleted" });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/:id/comments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) throw new AppError("Task not found", 404);
    await assertProjectAccess(req.user!, task.projectId);

    const { body } = createCommentSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: {
        taskId: task.id,
        authorId: req.user!.id,
        body,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      userId: req.user!.id,
      projectId: task.projectId,
      taskId: task.id,
      action: "COMMENT_ADDED",
      entityType: "COMMENT",
      entityId: comment.id,
      details: "Added a comment",
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
});

export default router;
