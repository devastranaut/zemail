import { createHash, randomBytes } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ApiKeyRow = {
  id: string;
  user_id: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type PublicApiKey = {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

function toPublicApiKey(row: ApiKeyRow): PublicApiKey {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
  };
}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey, "utf-8").digest("hex");
}

function generateApiKey(): string {
  return `zm_${randomBytes(32).toString("base64url")}`;
}

export async function createUserApiKey(userId: string, name?: string) {
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("mcp_api_keys")
    .insert({
      user_id: userId,
      name: name?.trim() || null,
      key_hash: keyHash,
    })
    .select("id, user_id, name, created_at, last_used_at, revoked_at")
    .single<ApiKeyRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create API key");
  }

  return {
    apiKey,
    key: toPublicApiKey(data),
  };
}

export async function listUserApiKeys(userId: string): Promise<PublicApiKey[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("mcp_api_keys")
    .select("id, user_id, name, created_at, last_used_at, revoked_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<ApiKeyRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toPublicApiKey);
}

export async function resolveUserByApiKey(apiKey: string): Promise<{
  userId: string;
  keyId: string;
} | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("mcp_api_keys")
    .select("id, user_id")
    .eq("key_hash", hashApiKey(apiKey))
    .is("revoked_at", null)
    .single<{ id: string; user_id: string }>();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.user_id,
    keyId: data.id,
  };
}

export async function touchApiKeyUsage(keyId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("mcp_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyId);

  if (error) {
    throw new Error(error.message);
  }
}
