import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role, UserStatus } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { publicUser } from "../lib/rbac";
import { authenticate, authorize } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { createUserSchema, loginSchema } from "../validators/schemas";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AppError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      success: true,
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AppError("User not found", 404);
    }
    res.json({ success: true, data: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

/** Admin creates users (no public self-registration after seed). */
router.post(
  "/register",
  authenticate,
  authorize(Role.ADMIN),
  async (req, res, next) => {
    try {
      const input = createUserSchema.parse(req.body);
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new AppError("Email already in use", 409);
      }

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
  }
);

export default router;
