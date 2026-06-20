import { NextResponse } from "next/server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTodoMcpServer } from "@/lib/mcp-server";
import { verifyAssistantKey } from "@/lib/assistant-auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { IncomingMessage, ServerResponse } from "http";

const allowedOrigins = ["*"];

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") || "*";

  const token = getBearerToken(req);
  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: "Missing Authorization header" }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": origin,
        },
      }
    );
  }

  const ctx = await verifyAssistantKey(token);
  if (!ctx) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid or revoked assistant key" }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": origin,
        },
      }
    );
  }

  const rate = checkRateLimit(ctx.keyId);
  if (!rate.allowed) {
    return new NextResponse(
      JSON.stringify({ error: "Rate limit exceeded" }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(rate.retryAfter),
          "access-control-allow-origin": origin,
        },
      }
    );
  }

  const server = createTodoMcpServer(ctx);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    allowedOrigins,
  });

  await server.connect(transport);

  const bodyText = await req.clone().text();
  let body: unknown;
  try {
    body = bodyText ? JSON.parse(bodyText) : undefined;
  } catch {
    body = undefined;
  }

  return handleMcpRequest(req, transport, body);
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "authorization, content-type",
    },
  });
}

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  bodyChunks: Uint8Array[];
  setHeader(key: string, value: string | number | string[]): MockResponse;
  writeHead(statusCode: number, headersObj?: Record<string, string>): MockResponse;
  write(chunk: Uint8Array | string): boolean;
  end(chunk?: Uint8Array | string): MockResponse;
}

async function handleMcpRequest(
  req: Request,
  transport: StreamableHTTPServerTransport,
  body: unknown
): Promise<Response> {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const incoming = {
    method: req.method,
    url: req.url,
    headers,
    body,
    on: () => {},
    once: () => {},
    emit: () => false,
  } as unknown as IncomingMessage;

  let resolveResponse: (value: Response) => void;
  const responsePromise = new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  });

  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    bodyChunks: [],
    setHeader(key: string, value: string | number | string[]) {
      this.headers[key.toLowerCase()] = Array.isArray(value)
        ? value.join(", ")
        : String(value);
      return this;
    },
    writeHead(statusCode: number, headersObj?: Record<string, string>) {
      this.statusCode = statusCode;
      if (headersObj) {
        Object.entries(headersObj).forEach(([k, v]) => this.setHeader(k, v));
      }
      return this;
    },
    write(chunk: Uint8Array | string) {
      if (typeof chunk === "string") {
        const encoder = new TextEncoder();
        this.bodyChunks.push(encoder.encode(chunk));
      } else {
        this.bodyChunks.push(chunk);
      }
      return true;
    },
    end(chunk?: Uint8Array | string) {
      if (chunk) this.write(chunk);
      const body = new Uint8Array(
        this.bodyChunks.reduce((acc, c) => acc + c.length, 0)
      );
      let offset = 0;
      for (const c of this.bodyChunks) {
        body.set(c, offset);
        offset += c.length;
      }
      resolveResponse(
        new Response(body, {
          status: this.statusCode,
          headers: this.headers,
        })
      );
      return this;
    },
  };

  transport.handleRequest(incoming, res as unknown as ServerResponse, body).catch(() => {
    resolveResponse(
      new Response(JSON.stringify({ error: "MCP transport error" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      })
    );
  });

  return responsePromise;
}
