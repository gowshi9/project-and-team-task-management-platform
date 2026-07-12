import { describe, expect, it } from "vitest";
import { createUserSchema, loginSchema, updateTaskSchema } from "../src/validators/schemas";
import { Role, TaskStatus } from "@prisma/client";

describe("validators", () => {
  it("accepts valid login payload", () => {
    const result = loginSchema.parse({
      email: "admin@teamflow.local",
      password: "Password123!",
    });
    expect(result.email).toBe("admin@teamflow.local");
  });

  it("rejects invalid email", () => {
    expect(() =>
      loginSchema.parse({ email: "bad", password: "Password123!" })
    ).toThrow();
  });

  it("accepts create user with role", () => {
    const result = createUserSchema.parse({
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
      role: Role.TEAM_MEMBER,
    });
    expect(result.role).toBe(Role.TEAM_MEMBER);
  });

  it("accepts member task progress update", () => {
    const result = updateTaskSchema.parse({
      status: TaskStatus.IN_PROGRESS,
      progress: 55,
    });
    expect(result.progress).toBe(55);
  });
});

describe("rbac helpers", () => {
  it("publicUser strips passwordHash", async () => {
    const { publicUser } = await import("../src/lib/rbac");
    const cleaned = publicUser({
      id: "1",
      name: "A",
      email: "a@b.com",
      passwordHash: "secret",
      role: Role.ADMIN,
    });
    expect(cleaned).not.toHaveProperty("passwordHash");
    expect(cleaned.email).toBe("a@b.com");
  });
});
