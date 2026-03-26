import { NextRequest, NextResponse } from "next/server";

import { createAuthTicket } from "@/lib/google/oauthSessionStore";

export async function GET(request: NextRequest) {
  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing MCP_API_KEY environment variable" },
      { status: 500 },
    );
  }

  const ticket = createAuthTicket(apiKey);
  const setupKey = process.env.OAUTH_SETUP_KEY;
  const params = new URLSearchParams({
    ticket,
    returnTo: "/",
  });

  if (setupKey) {
    params.set("setupKey", setupKey);
  }

  const redirectUrl = new URL(`/api/auth/google/start?${params.toString()}`, request.url);
  return NextResponse.redirect(redirectUrl);
}
