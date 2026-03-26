import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type GoogleConnectionRow = {
  user_id: string;
  refresh_token_encrypted: string;
  updated_at: string;
};

export async function upsertUserGoogleRefreshToken(
  userId: string,
  refreshToken: string,
) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("user_google_connections").upsert(
    {
      user_id: userId,
      refresh_token_encrypted: encryptSecret(refreshToken),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getUserGoogleRefreshToken(
  userId: string,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_google_connections")
    .select("user_id, refresh_token_encrypted, updated_at")
    .eq("user_id", userId)
    .single<GoogleConnectionRow>();

  if (error || !data) {
    return null;
  }

  return decryptSecret(data.refresh_token_encrypted);
}
