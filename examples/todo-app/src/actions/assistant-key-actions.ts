"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyToken, getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateAssistantKey as generateAssistantKeyValue,
  hashAssistantKey,
} from "@/lib/assistant-auth";

async function getCurrentUser() {
  const token = (await cookies()).get("token")?.value;
  if (!token) throw new Error("No autorizado");
  const user = await verifyToken(token);
  if (!user) throw new Error("No autorizado");
  return user;
}

export async function generateAssistantKey(name: string) {
  const user = await getCurrentUser();
  const tenantId = getTenantId(user);

  const plainKey = generateAssistantKeyValue();
  const keyHash = hashAssistantKey(plainKey);

  await prisma.assistantApiKey.create({
    data: {
      name: name || "Asistente",
      keyHash,
      userId: user.id,
      tenantId,
    },
  });

  revalidatePath("/settings");
  return { plainKey };
}

export async function listAssistantKeys() {
  const user = await getCurrentUser();
  const tenantId = getTenantId(user);

  return prisma.assistantApiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });
}

export async function revokeAssistantKey(id: string) {
  const user = await getCurrentUser();
  const tenantId = getTenantId(user);

  const key = await prisma.assistantApiKey.findFirst({
    where: { id, tenantId },
  });
  if (!key) throw new Error("Clave no encontrada");

  await prisma.assistantApiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/settings");
}
