import { prisma } from "@/lib/prisma";
import { TodoSource } from "@prisma/client";
import { z } from "zod";

export interface ServiceContext {
  tenantId: string;
  userId: string;
  source: TodoSource;
  assistantApiKeyId?: string | null;
}

const todoSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "done", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
});

export type TodoInput = z.infer<typeof todoSchema>;

export async function listTodos(
  ctx: ServiceContext,
  filters?: {
    status?: string;
    priority?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
  }
) {
  const where: Record<string, unknown> = { tenantId: ctx.tenantId };

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
    take: filters?.limit ? Math.min(filters.limit, 100) : 100,
  });
}

export async function getTodo(ctx: ServiceContext, id: string) {
  return prisma.todo.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: { category: true },
  });
}

export async function createTodo(ctx: ServiceContext, data: TodoInput) {
  const parsed = todoSchema.parse(data);
  return prisma.todo.create({
    data: {
      ...parsed,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      source: ctx.source,
      assistantApiKeyId: ctx.assistantApiKeyId ?? null,
    },
    include: { category: true },
  });
}

export async function updateTodo(
  ctx: ServiceContext,
  id: string,
  data: Partial<TodoInput>
) {
  const existing = await prisma.todo.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new Error("Todo no encontrado");
  }

  return prisma.todo.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: { category: true },
  });
}

export async function deleteTodo(ctx: ServiceContext, id: string) {
  const existing = await prisma.todo.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new Error("Todo no encontrado");
  }

  await prisma.todo.delete({ where: { id } });
}

export async function listCategories(ctx: ServiceContext) {
  return prisma.todoCategory.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  ctx: ServiceContext,
  data: { name: string; color?: string }
) {
  return prisma.todoCategory.create({
    data: {
      name: data.name,
      color: data.color || "#3b82f6",
      tenantId: ctx.tenantId,
    },
  });
}

export async function getStats(ctx: ServiceContext) {
  const base = { tenantId: ctx.tenantId };
  const [total, pending, in_progress, done, urgent] = await Promise.all([
    prisma.todo.count({ where: base }),
    prisma.todo.count({ where: { ...base, status: "pending" } }),
    prisma.todo.count({ where: { ...base, status: "in_progress" } }),
    prisma.todo.count({ where: { ...base, status: "done" } }),
    prisma.todo.count({ where: { ...base, priority: "urgent" } }),
  ]);

  return { total, pending, in_progress, done, urgent };
}

export { TodoSource };
