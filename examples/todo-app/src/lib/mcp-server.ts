import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  listCategories,
  getStats,
  TodoSource,
} from "@/lib/todo-service";
import { AssistantContext } from "@/lib/assistant-auth";

export function createTodoMcpServer(ctx: AssistantContext) {
  const server = new McpServer({
    name: "moonsbow-todo-assistant",
    version: "1.0.0",
  });

  const serviceCtx = {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    source: TodoSource.ASSISTANT,
    assistantApiKeyId: ctx.keyId,
  };

  server.tool(
    "list_todos",
    "List todos with optional filters",
    {
      status: z.enum(["pending", "in_progress", "done", "archived", "all"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent", "all"]).optional(),
      categoryId: z.string().uuid().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
    },
    async (args) => {
      const todos = await listTodos(serviceCtx, {
        status: args.status,
        priority: args.priority,
        categoryId: args.categoryId,
        search: args.search,
        limit: args.limit,
      });
      return {
        content: [
          { type: "text", text: JSON.stringify(todos, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "get_todo",
    "Get a single todo by id",
    { id: z.string().uuid() },
    async (args) => {
      const todo = await getTodo(serviceCtx, args.id);
      if (!todo) {
        return {
          content: [{ type: "text", text: "Todo no encontrado" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(todo, null, 2) }],
      };
    }
  );

  server.tool(
    "create_todo",
    "Create a new todo",
    {
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "done", "archived"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      dueDate: z.string().datetime().optional(),
      categoryId: z.string().uuid().optional(),
    },
    async (args) => {
      const todo = await createTodo(serviceCtx, args);
      return {
        content: [{ type: "text", text: JSON.stringify(todo, null, 2) }],
      };
    }
  );

  server.tool(
    "update_todo",
    "Update a todo by id",
    {
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "done", "archived"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      dueDate: z.string().datetime().optional(),
      categoryId: z.string().uuid().optional(),
    },
    async (args) => {
      const { id, ...data } = args;
      const todo = await updateTodo(serviceCtx, id, data);
      return {
        content: [{ type: "text", text: JSON.stringify(todo, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_todo",
    "Delete a todo by id",
    { id: z.string().uuid() },
    async (args) => {
      await deleteTodo(serviceCtx, args.id);
      return {
        content: [{ type: "text", text: "Todo eliminado" }],
      };
    }
  );

  server.tool("list_categories", "List todo categories", {}, async () => {
    const categories = await listCategories(serviceCtx);
    return {
      content: [{ type: "text", text: JSON.stringify(categories, null, 2) }],
    };
  });

  server.tool("get_stats", "Get todo statistics", {}, async () => {
    const stats = await getStats(serviceCtx);
    return {
      content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
    };
  });

  return server;
}
