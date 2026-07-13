import { Router, Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
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
  createProjectSchema,
  projectMemberSchema,
  updateProjectSchema,
} from "../validators/schemas";

const router = Router();

router.use(authenticate);

const projectInclude = {
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, role: true, status: true } },
    },
  },
  _count: { select: { tasks: true } },
} as const;

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    let projects;

    if (isAdmin(user)) {
      projects = await prisma.project.findMany({
        include: projectInclude,
        orderBy: { updatedAt: "desc" },
      });
    } else if (isProjectManager(user)) {
      projects = await prisma.project.findMany({
        where: {
          OR: [
            { createdById: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
        include: projectInclude,
        orderBy: { updatedAt: "desc" },
      });
    } else {
      projects = await prisma.project.findMany({
        where: { members: { some: { userId: user.id } } },
        include: projectInclude,
        orderBy: { updatedAt: "desc" },
      });
    }

    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertProjectAccess(req.user!, req.params.id);
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        ...projectInclude,
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
        activityLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createProjectSchema.parse(req.body);
      const memberIds = new Set(input.memberIds ?? []);
      memberIds.add(req.user!.id);

      const users = await prisma.user.findMany({
        where: { id: { in: [...memberIds] } },
      });
      if (users.length !== memberIds.size) {
        throw new AppError("One or more member IDs are invalid", 400);
      }

      const project = await prisma.project.create({
        data: {
          name: input.name,
          description: input.description ?? undefined,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          createdById: req.user!.id,
          members: {
            create: [...memberIds].map((userId) => ({ userId })),
          },
        },
        include: projectInclude,
      });

      await logActivity({
        userId: req.user!.id,
        projectId: project.id,
        action: "PROJECT_CREATED",
        entityType: "PROJECT",
        entityId: project.id,
        details: `Created project "${project.name}"`,
      });

      res.status(201).json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertProjectAccess(req.user!, req.params.id, { requireManage: true });
    const input = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...input,
        startDate:
          input.startDate === undefined
            ? undefined
            : input.startDate
              ? new Date(input.startDate)
              : null,
        endDate:
          input.endDate === undefined
            ? undefined
            : input.endDate
              ? new Date(input.endDate)
              : null,
      },
      include: projectInclude,
    });

    await logActivity({
      userId: req.user!.id,
      projectId: project.id,
      action: "PROJECT_UPDATED",
      entityType: "PROJECT",
      entityId: project.id,
      details: `Updated project "${project.name}"`,
    });

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertProjectAccess(req.user!, req.params.id, { requireManage: true });
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) throw new AppError("Project not found", 404);

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/members", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertProjectAccess(req.user!, req.params.id, { requireManage: true });
    const { userId } = projectMemberSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: req.params.id, userId },
      },
      create: { projectId: req.params.id, userId },
      update: {},
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await logActivity({
      userId: req.user!.id,
      projectId: req.params.id,
      action: "MEMBER_ADDED",
      entityType: "PROJECT",
      entityId: req.params.id,
      details: `Added member ${user.name}`,
    });

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/members/:userId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assertProjectAccess(req.user!, req.params.id, { requireManage: true });
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: req.params.id,
          userId: req.params.userId,
        },
      },
    });
    if (!membership) throw new AppError("Membership not found", 404);

    await prisma.projectMember.delete({ where: { id: membership.id } });

    await logActivity({
      userId: req.user!.id,
      projectId: req.params.id,
      action: "MEMBER_REMOVED",
      entityType: "PROJECT",
      entityId: req.params.id,
      details: `Removed member ${req.params.userId}`,
    });

    res.json({ success: true, message: "Member removed" });
  } catch (err) {
    next(err);
  }
});

export default router;
