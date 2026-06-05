import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.MOONSBOW_API_KEY || "";

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expected = createHmac("sha256", API_KEY).update(payload).digest("hex");
  const received = signature.replace("sha256=", "");
  return expected === received;
}

export async function handleSyncEvent(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  switch (eventType) {
    case "sync.user.created":
    case "sync.user.updated":
      await prisma.localUser.upsert({
        where: { id: payload.id as string },
        update: {
          email: payload.email as string,
          fullName: (payload.full_name as string) || null,
          tenantId: payload.tenant_id as string,
          isActive: (payload.is_active as boolean) ?? true,
          syncedAt: new Date(),
        },
        create: {
          id: payload.id as string,
          email: payload.email as string,
          fullName: (payload.full_name as string) || null,
          tenantId: payload.tenant_id as string,
          isActive: (payload.is_active as boolean) ?? true,
          syncedAt: new Date(),
        },
      });
      break;

    case "sync.tenant.created":
    case "sync.tenant.updated":
      await prisma.localTenant.upsert({
        where: { id: payload.id as string },
        update: {
          name: payload.name as string,
          slug: payload.slug as string,
          plan: (payload.plan as string) || "free",
          isActive: (payload.is_active as boolean) ?? true,
          syncedAt: new Date(),
        },
        create: {
          id: payload.id as string,
          name: payload.name as string,
          slug: payload.slug as string,
          plan: (payload.plan as string) || "free",
          isActive: (payload.is_active as boolean) ?? true,
          syncedAt: new Date(),
        },
      });
      break;

    case "sync.subscription.created":
    case "sync.subscription.updated":
      await prisma.localSubscription.upsert({
        where: { id: payload.id as string },
        update: {
          tenantId: payload.tenant_id as string,
          plan: payload.plan as string,
          status: payload.status as string,
          startedAt: payload.started_at
            ? new Date(payload.started_at as string)
            : null,
          expiresAt: payload.expires_at
            ? new Date(payload.expires_at as string)
            : null,
          syncedAt: new Date(),
        },
        create: {
          id: payload.id as string,
          tenantId: payload.tenant_id as string,
          plan: payload.plan as string,
          status: payload.status as string,
          startedAt: payload.started_at
            ? new Date(payload.started_at as string)
            : null,
          expiresAt: payload.expires_at
            ? new Date(payload.expires_at as string)
            : null,
          syncedAt: new Date(),
        },
      });
      break;

    default:
      console.warn(`Unhandled sync event: ${eventType}`);
  }
}
