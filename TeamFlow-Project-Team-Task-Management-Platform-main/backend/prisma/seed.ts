import bcrypt from "bcryptjs";
import { PrismaClient, Role, TaskPriority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding TeamFlow database...");

  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@teamflow.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const pm = await prisma.user.create({
    data: {
      name: "Priya Manager",
      email: "pm@teamflow.local",
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: "Alex Member",
      email: "alex@teamflow.local",
      passwordHash,
      role: Role.TEAM_MEMBER,
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: "Sam Worker",
      email: "sam@teamflow.local",
      passwordHash,
      role: Role.TEAM_MEMBER,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Revamp the marketing site and customer portal.",
      createdById: pm.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: pm.id },
          { userId: member1.id },
          { userId: member2.id },
        ],
      },
    },
  });

  const task1 = await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Design homepage mockups",
      description: "Create Figma mockups for desktop and mobile.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      progress: 40,
      assigneeId: member1.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Set up CI pipeline",
      description: "Configure GitHub Actions for lint and build.",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      progress: 0,
      assigneeId: member2.id,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Stakeholder kickoff",
      description: "Align on scope and success metrics.",
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      progress: 100,
      assigneeId: pm.id,
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task1.id,
      authorId: pm.id,
      body: "Please prioritize mobile layouts first.",
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: pm.id,
      projectId: project.id,
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: project.id,
      details: `Created project "${project.name}"`,
    },
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password: Password123!):");
  console.log(`  Admin:  ${admin.email}`);
  console.log(`  PM:     ${pm.email}`);
  console.log(`  Member: ${member1.email}`);
  console.log(`  Member: ${member2.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
