import { NextRequest, NextResponse } from "next/server";

import { createAuthTicket } from "@/lib/google/oauthSessionStore";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/?auth=required", request.url));
  }

  const ticket = createAuthTicket(user.id);
  const params = new URLSearchParams({
    ticket,
    returnTo: "/",
  });

  if (process.env.OAUTH_SETUP_KEY) {
    params.set("setupKey", process.env.OAUTH_SETUP_KEY);
  }

  const redirectUrl = new URL(`/api/auth/google/start?${params.toString()}`, request.url);
  return NextResponse.redirect(redirectUrl);
}
