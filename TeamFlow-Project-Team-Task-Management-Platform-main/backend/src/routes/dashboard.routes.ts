import { Router } from "express";
import { ProjectStatus, Role, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { isAdmin, isProjectManager } from "../lib/rbac";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/stats", async (req, res, next) => {
  try {
    const user = req.user!;

    if (isAdmin(user)) {
      const [users, projects, tasks, activeProjects, doneTasks] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.task.count(),
        prisma.project.count({ where: { status: ProjectStatus.ACTIVE } }),
        prisma.task.count({ where: { status: TaskStatus.DONE } }),
      ]);

      const tasksByStatus = await prisma.task.groupBy({
        by: ["status"],
        _count: { _all: true },
      });

      return res.json({
        success: true,
        data: {
          role: user.role,
          users,
          projects,
          activeProjects,
          tasks,
          doneTasks,
          tasksByStatus: Object.fromEntries(
            tasksByStatus.map((t) => [t.status, t._count._all])
          ),
        },
      });
    }

    if (isProjectManager(user)) {
      const projectWhere = {
        OR: [
          { createdById: user.id },
          { members: { some: { userId: user.id } } },
        ],
      };

      const [projects, tasks, members] = await Promise.all([
        prisma.project.count({ where: projectWhere }),
        prisma.task.count({
          where: {
            project: projectWhere,
          },
        }),
        prisma.projectMember.count({
          where: { project: { createdById: user.id } },
        }),
      ]);

      const tasksByStatus = await prisma.task.groupBy({
        by: ["status"],
        where: { project: projectWhere },
        _count: { _all: true },
      });

      return res.json({
        success: true,
        data: {
          role: user.role,
          projects,
          tasks,
          members,
          tasksByStatus: Object.fromEntries(
            tasksByStatus.map((t) => [t.status, t._count._all])
          ),
        },
      });
    }

    // Team member
    const [projects, assignedTasks, myDone] = await Promise.all([
      prisma.project.count({
        where: { members: { some: { userId: user.id } } },
      }),
      prisma.task.count({ where: { assigneeId: user.id } }),
      prisma.task.count({
        where: { assigneeId: user.id, status: TaskStatus.DONE },
      }),
    ]);

    const tasksByStatus = await prisma.task.groupBy({
      by: ["status"],
      where: { assigneeId: user.id },
      _count: { _all: true },
    });

    res.json({
      success: true,
      data: {
        role: Role.TEAM_MEMBER,
        projects,
        assignedTasks,
        completedTasks: myDone,
        tasksByStatus: Object.fromEntries(
          tasksByStatus.map((t) => [t.status, t._count._all])
        ),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/activity", async (req, res, next) => {
  try {
    const user = req.user!;
    const take = Math.min(Number(req.query.limit) || 25, 100);

    const where = isAdmin(user)
      ? {}
      : isProjectManager(user)
        ? {
            OR: [
              { userId: user.id },
              { project: { createdById: user.id } },
              { project: { members: { some: { userId: user.id } } } },
            ],
          }
        : {
            OR: [
              { userId: user.id },
              { project: { members: { some: { userId: user.id } } } },
            ],
          };

    const logs = await prisma.activityLog.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
