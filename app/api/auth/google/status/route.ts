import { NextResponse } from "next/server";

import { getUserGoogleRefreshToken } from "@/lib/auth/googleConnections";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refreshToken = await getUserGoogleRefreshToken(user.id);
  return NextResponse.json({ connected: Boolean(refreshToken) });
}