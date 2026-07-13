import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { publicUser } from "../lib/rbac";
import { authenticate, authorize } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { createUserSchema, updateUserSchema } from "../validators/schemas";

const router = Router();

router.use(authenticate);

/** Directory of active users for assignment (Admin + PM). */
router.get(
  "/directory",
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        where: { status: UserStatus.ACTIVE },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }
);

router.use(authorize(Role.ADMIN));

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: users.map(publicUser) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError("User not found", 404);
    res.json({ success: true, data: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError("Email already in use", 409);

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
    });
    res.status(201).json({ success: true, data: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("User not found", 404);

    if (input.email && input.email !== existing.email) {
      const clash = await prisma.user.findUnique({ where: { email: input.email } });
      if (clash) throw new AppError("Email already in use", 409);
    }

    const data: Record<string, unknown> = { ...input };
    delete data.password;
    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.user!.id) {
      throw new AppError("Cannot delete your own account", 400);
    }
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("User not found", 404);

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
