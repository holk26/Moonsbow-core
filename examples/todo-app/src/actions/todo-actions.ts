"use server";

import { verifyToken, getTenantId } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createTodo as createTodoService,
  updateTodo as updateTodoService,
  deleteTodo as deleteTodoService,
  createCategory as createCategoryService,
  listTodos,
  listCategories,
  getStats as getStatsService,
  TodoSource,
  TodoInput,
} from "@/lib/todo-service";

async function getUserContext() {
  const token = (await cookies()).get("token")?.value;
  if (!token) throw new Error("No autorizado");
  const user = await verifyToken(token);
  if (!user) throw new Error("No autorizado");
  return {
    tenantId: getTenantId(user),
    userId: user.id,
    source: TodoSource.USER,
    assistantApiKeyId: null,
  };
}

export async function getTodos(filters?: {
  status?: string;
  priority?: string;
  categoryId?: string;
  search?: string;
}) {
  const ctx = await getUserContext();
  return listTodos(ctx, filters);
}

export async function createTodo(data: TodoInput) {
  const ctx = await getUserContext();
  const todo = await createTodoService(ctx, data);
  revalidatePath("/");
  return todo;
}

export async function updateTodo(id: string, data: Partial<TodoInput>) {
  const ctx = await getUserContext();
  const todo = await updateTodoService(ctx, id, data);
  revalidatePath("/");
  return todo;
}

export async function deleteTodo(id: string) {
  const ctx = await getUserContext();
  await deleteTodoService(ctx, id);
  revalidatePath("/");
}

export async function getCategories() {
  const ctx = await getUserContext();
  return listCategories(ctx);
}

export async function createCategory(data: { name: string; color?: string }) {
  const ctx = await getUserContext();
  const category = await createCategoryService(ctx, data);
  revalidatePath("/");
  return category;
}

export async function getStats() {
  const ctx = await getUserContext();
  return getStatsService(ctx);
}
