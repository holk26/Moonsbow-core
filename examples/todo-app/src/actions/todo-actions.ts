"use server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";

async function getCurrentUser() {
  const token = (await cookies()).get("token")?.value;
  if (!token) throw new Error("Unauthorized");
  const user = await verifyToken(token);
  if (!user) throw new Error("Unauthorized");
  return user;
}

const todoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z
    .enum(["pending", "in_progress", "done", "archived"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
});

export async function getTodos(filters?: {
  status?: string;
  priority?: string;
  categoryId?: string;
  search?: string;
}) {
  const user = await getCurrentUser();

  const where: Record<string, unknown> = {
    tenantId: user.tenantId,
  };

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }
  if (filters?.priority && filters.priority !== "all") {
    where.priority = filters.priority;
  }
  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.todo.findMany({
    where,
    include: { category: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function createTodo(data: z.infer<typeof todoSchema>) {
  const user = await getCurrentUser();
  const parsed = todoSchema.parse(data);

  const todo = await prisma.todo.create({
    data: {
      ...parsed,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      tenantId: user.tenantId,
      createdBy: user.id,
    },
    include: { category: true },
  });

  revalidatePath("/");
  return todo;
}

export async function updateTodo(
  id: string,
  data: Partial<z.infer<typeof todoSchema>>
) {
  const user = await getCurrentUser();

  const todo = await prisma.todo.update({
    where: { id, tenantId: user.tenantId },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: { category: true },
  });

  revalidatePath("/");
  return todo;
}

export async function deleteTodo(id: string) {
  const user = await getCurrentUser();

  await prisma.todo.delete({
    where: { id, tenantId: user.tenantId },
  });

  revalidatePath("/");
}

export async function getCategories() {
  const user = await getCurrentUser();

  return prisma.todoCategory.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(data: {
  name: string;
  color?: string;
}) {
  const user = await getCurrentUser();

  const category = await prisma.todoCategory.create({
    data: {
      name: data.name,
      color: data.color || "#3b82f6",
      tenantId: user.tenantId,
    },
  });

  revalidatePath("/");
  return category;
}

export async function getStats() {
  const user = await getCurrentUser();

  const [total, pending, done, urgent] = await Promise.all([
    prisma.todo.count({ where: { tenantId: user.tenantId } }),
    prisma.todo.count({
      where: { tenantId: user.tenantId, status: "pending" },
    }),
    prisma.todo.count({
      where: { tenantId: user.tenantId, status: "done" },
    }),
    prisma.todo.count({
      where: { tenantId: user.tenantId, priority: "urgent" },
    }),
  ]);

  return { total, pending, done, urgent };
}
