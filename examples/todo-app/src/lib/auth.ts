import { jwtVerify, JWTPayload } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.MOONSBOW_SECRET_KEY || ""
);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantPlan: string | null;
}

/**
 * Returns the tenant id to use for data isolation.
 * Users without an assigned tenant (e.g. the dev user) fall back to their own
 * user id so they still have a private scope for todos.
 */
export function getTenantId(user: AuthUser): string {
  return user.tenantId ?? user.id;
}

export async function verifyToken(
  token: string
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      clockTolerance: 60,
    });
    return {
      id: payload.sub as string,
      email: (payload.email as string) || "",
      name: (payload.name as string) || "",
      tenantId: (payload.tenant_id as string) || null,
      tenantSlug: (payload.tenant_slug as string) || null,
      tenantPlan: (payload.tenant_plan as string) || null,
    };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(
  req: Request
): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}
