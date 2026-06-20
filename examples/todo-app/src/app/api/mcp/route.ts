import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAssistantKey } from "@/lib/assistant-auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  listCategories,
  getStats,
  TodoSource,
  TodoInput,
} from "@/lib/todo-service";

const SERVER_INFO = {
  name: "moonsbow-todo-assistant",
  version: "1.0.0",
};

const todoInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "done", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
});

const tools = [
  {
    name: "list_todos",
    description: "List todos with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "in_progress", "done", "archived", "all"],
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent", "all"],
        },
        categoryId: { type: "string", format: "uuid" },
        search: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 100 },
      },
    },
    paramsSchema: z.object({
      status: z.enum(["pending", "in_progress", "done", "archived", "all"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent", "all"]).optional(),
      categoryId: z.string().uuid().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
    }),
    handler: async (
      ctx: { tenantId: string; userId: string; keyId: string },
      args: {
        status?: string;
        priority?: string;
        categoryId?: string;
        search?: string;
        limit?: number;
      }
    ) => {
      const todos = await listTodos(
        {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          source: TodoSource.ASSISTANT,
          assistantApiKeyId: ctx.keyId,
        },
        args
      );
      return { content: [{ type: "text", text: JSON.stringify(todos, null, 2) }] };
    },
  },
  {
    name: "get_todo",
    description: "Get a single todo by id",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", format: "uuid" },
      },
    },
    paramsSchema: z.object({ id: z.string().uuid() }),
    handler: async (
      ctx: { tenantId: string; userId: string; keyId: string },
      args: { id: string }
    ) => {
      const todo = await getTodo(
        {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          source: TodoSource.ASSISTANT,
          assistantApiKeyId: ctx.keyId,
        },
        args.id
      );
      if (!todo) {
        return {
          content: [{ type: "text", text: "Todo no encontrado" }],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(todo, null, 2) }] };
    },
  },
  {
    name: "create_todo",
    description: "Create a new todo",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", minLength: 1, maxLength: 255 },
        description: { type: "string" },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "done", "archived"],
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
        },
        dueDate: { type: "string", format: "date-time" },
        categoryId: { type: "string", format: "uuid" },
      },
    },
    paramsSchema: todoInputSchema,
    handler: async (
      ctx: { tenantId: string; userId: string; keyId: string },
      args: TodoInput
    ) => {
      const todo = await createTodo(
        {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          source: TodoSource.ASSISTANT,
          assistantApiKeyId: ctx.keyId,
        },
        args
      );
      return { content: [{ type: "text", text: JSON.stringify(todo, null, 2) }] };
    },
  },
  {
    name: "update_todo",
    description: "Update a todo by id",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string", minLength: 1, maxLength: 255 },
        description: { type: "string" },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "done", "archived"],
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
        },
        dueDate: { type: "string", format: "date-time" },
        categoryId: { type: "string", format: "uuid" },
      },
    },
    paramsSchema: z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "done", "archived"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      dueDate: z.string().datetime().optional(),
      categoryId: z.string().uuid().optional(),
    }),
    handler: async (
      ctx: { tenantId: string; userId: string; keyId: string },
      args: { id: string } & Partial<TodoInput>
    ) => {
      const { id, ...data } = args;
      const todo = await updateTodo(
        {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          source: TodoSource.ASSISTANT,
          assistantApiKeyId: ctx.keyId,
        },
        id,
        data
      );
      return { content: [{ type: "text", text: JSON.stringify(todo, null, 2) }] };
    },
  },
  {
    name: "delete_todo",
    description: "Delete a todo by id",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", format: "uuid" },
      },
    },
    paramsSchema: z.object({ id: z.string().uuid() }),
    handler: async (
      ctx: { tenantId: string; userId: string; keyId: string },
      args: { id: string }
    ) => {
      await deleteTodo(
        {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          source: TodoSource.ASSISTANT,
          assistantApiKeyId: ctx.keyId,
        },
        args.id
      );
      return { content: [{ type: "text", text: "Todo eliminado" }] };
    },
  },
  {
    name: "list_categories",
    description: "List todo categories",
    inputSchema: {
      type: "object",
      properties: {},
    },
    paramsSchema: z.object({}),
    handler: async (ctx: { tenantId: string; userId: string; keyId: string }) => {
      const categories = await listCategories({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        source: TodoSource.ASSISTANT,
        assistantApiKeyId: ctx.keyId,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(categories, null, 2) }],
      };
    },
  },
  {
    name: "get_stats",
    description: "Get todo statistics",
    inputSchema: {
      type: "object",
      properties: {},
    },
    paramsSchema: z.object({}),
    handler: async (ctx: { tenantId: string; userId: string; keyId: string }) => {
      const stats = await getStats({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        source: TodoSource.ASSISTANT,
        assistantApiKeyId: ctx.keyId,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
      };
    },
  },
];

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
  };
}

function jsonResponse(
  status: number,
  body: unknown,
  origin: string,
  extraHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...corsHeaders(origin), ...extraHeaders },
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || "*";

  const token = getBearerToken(req);
  if (!token) {
    return jsonResponse(401, { error: "Missing Authorization header" }, origin);
  }

  const ctx = await verifyAssistantKey(token);
  if (!ctx) {
    return jsonResponse(
      401,
      { error: "Invalid or revoked assistant key" },
      origin
    );
  }

  const rate = checkRateLimit(ctx.keyId);
  if (!rate.allowed) {
    return jsonResponse(
      429,
      { error: "Rate limit exceeded" },
      origin,
      { "retry-after": String(rate.retryAfter) }
    );
  }

  let message: unknown;
  try {
    message = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" }, origin);
  }

  const rpc = message as {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: unknown;
  };

  if (rpc.jsonrpc !== "2.0") {
    return jsonResponse(
      400,
      { jsonrpc: "2.0", id: rpc.id ?? null, error: { code: -32600, message: "Invalid Request" } },
      origin
    );
  }

  try {
    const result = await handleMcpMethod(ctx, rpc.method, rpc.params);
    if (result === undefined) {
      // Notification: no response body
      return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
    }
    return jsonResponse(
      200,
      { jsonrpc: "2.0", id: rpc.id ?? null, result },
      origin
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(
      200,
      { jsonrpc: "2.0", id: rpc.id ?? null, error: { code: -32603, message } },
      origin
    );
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

async function handleMcpMethod(
  ctx: { tenantId: string; userId: string; keyId: string },
  method: string | undefined,
  params: unknown
): Promise<unknown> {
  if (method === "initialize") {
    const init = params as { protocolVersion?: string } | undefined;
    return {
      protocolVersion: init?.protocolVersion ?? "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
    };
  }

  if (method === "notifications/initialized") {
    return undefined;
  }

  if (method === "tools/list") {
    return {
      tools: tools.map(({ name, description, inputSchema }) => ({
        name,
        description,
        inputSchema,
      })),
    };
  }

  if (method === "tools/call") {
    const callParams = z
      .object({ name: z.string(), arguments: z.record(z.unknown()).default({}) })
      .parse(params);
    const tool = tools.find((t) => t.name === callParams.name);
    if (!tool) {
      throw new Error(`Tool not found: ${callParams.name}`);
    }
    const parsedArgs = tool.paramsSchema.parse(callParams.arguments);
    return tool.handler(ctx, parsedArgs as never);
  }

  throw new Error(`Method not found: ${method}`);
}
