import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

const SALT = process.env.ASSISTANT_API_KEY_SALT || "";

if (SALT.length < 16) {
  console.warn(
    "ASSISTANT_API_KEY_SALT is too short. Assistant API key security is weakened."
  );
}

export interface AssistantContext {
  keyId: string;
  userId: string;
  tenantId: string;
}

export function generateAssistantKey(): string {
  const prefix = "mb_todo_";
  const random = randomBytes(32).toString("hex");
  return `${prefix}${random}`;
}

export function hashAssistantKey(key: string): string {
  return createHash("sha256").update(`${key}${SALT}`).digest("hex");
}

export async function verifyAssistantKey(
  key: string
): Promise<AssistantContext | null> {
  const hash = hashAssistantKey(key);
  const record = await prisma.assistantApiKey.findFirst({
    where: { keyHash: hash, revokedAt: null },
  });

  if (!record) return null;
  if (!record.tenantId) return null;

  await prisma.assistantApiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    keyId: record.id,
    userId: record.userId,
    tenantId: record.tenantId,
  };
}
