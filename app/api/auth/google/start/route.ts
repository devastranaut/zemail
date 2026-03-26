import { NextRequest, NextResponse } from "next/server";

import { getGoogleConsentUrl } from "@/lib/google/oauth";
import { createAuthTicket } from "@/lib/google/oauthSessionStore";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isSetupAuthorized(request: NextRequest): boolean {
  const setupKey = process.env.OAUTH_SETUP_KEY;
  if (!setupKey) {
    return true;
  }

  return request.nextUrl.searchParams.get("setupKey") === setupKey;
}

export async function GET(request: NextRequest) {
  if (!isSetupAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/";
  let ticket = request.nextUrl.searchParams.get("ticket") ?? undefined;

  if (!ticket) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      ticket = createAuthTicket(user.id);
    }
  }

  if (!ticket) {
    return NextResponse.json({ error: "Missing auth ticket" }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ returnTo, ticket }), "utf-8").toString(
    "base64url",
  );
  const consentUrl = getGoogleConsentUrl(state);

  return NextResponse.redirect(consentUrl);
}