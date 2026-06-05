import { jwtVerify, JWTPayload } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.MOONSBOW_SECRET_KEY || ""
);

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  tenantSlug: string;
  tenantPlan: string;
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
      email: payload.email as string,
      name: (payload.name as string) || "",
      tenantId: payload.tenant_id as string,
      tenantSlug: payload.tenant_slug as string,
      tenantPlan: payload.tenant_plan as string,
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
