-- CreateEnum
CREATE TYPE "todo_source" AS ENUM ('USER', 'ASSISTANT');

-- AlterTable
ALTER TABLE "todos" ADD COLUMN     "assistant_api_key_id" UUID,
ADD COLUMN     "source" "todo_source" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "assistant_api_keys" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "assistant_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_api_keys_key_hash_idx" ON "assistant_api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "assistant_api_keys_user_id_idx" ON "assistant_api_keys"("user_id");

-- CreateIndex
CREATE INDEX "todos_assistant_api_key_id_idx" ON "todos"("assistant_api_key_id");

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_assistant_api_key_id_fkey" FOREIGN KEY ("assistant_api_key_id") REFERENCES "assistant_api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
