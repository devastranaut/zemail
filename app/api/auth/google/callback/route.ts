import { NextRequest, NextResponse } from "next/server";

import { upsertUserGoogleRefreshToken } from "@/lib/auth/googleConnections";
import { exchangeOAuthCode } from "@/lib/google/oauth";
import { consumeAuthTicket } from "@/lib/google/oauthSessionStore";

function parseState(state: string | null): { returnTo: string; ticket?: string } {
  if (!state) {
    return { returnTo: "/" };
  }

  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded) as { returnTo?: string; ticket?: string };
    return { returnTo: parsed.returnTo || "/", ticket: parsed.ticket };
  } catch {
    return { returnTo: "/" };
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.json(
      { error: `OAuth failed: ${error}` },
      { status: 400 },
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 },
    );
  }

  const state = parseState(request.nextUrl.searchParams.get("state"));

  try {
    const tokens = await exchangeOAuthCode(code);

    const refreshToken = tokens.refresh_token ?? "";
    const accessToken = tokens.access_token ?? "";
    const userId = state.ticket ? consumeAuthTicket(state.ticket) : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid or expired OAuth ticket" },
        { status: 400 },
      );
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          error:
            "Google did not return a refresh token. Re-run consent and ensure prompt=consent.",
        },
        { status: 400 },
      );
    }

    await upsertUserGoogleRefreshToken(userId, refreshToken);

    const tokenHint = refreshToken.length > 16
      ? `${refreshToken.slice(0, 8)}...${refreshToken.slice(-6)}`
      : "stored";

    if (!accessToken) {
      console.warn("Google OAuth callback returned no access token");
    }

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zemail OAuth Complete</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; background: #09090b; color: #e4e4e7; }
      main { max-width: 760px; margin: 40px auto; padding: 20px; }
      .card { border: 1px solid #27272a; border-radius: 12px; padding: 16px; background: #18181b; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #0f0f12; border-radius: 8px; padding: 12px; border: 1px solid #27272a; }
      a { color: #67e8f9; }
    </style>
  </head>
  <body>
    <main>
      <h1>Google OAuth connected</h1>
      <p>Your Google account is now linked to your user profile.</p>
      <div class="card">
        <h2>Status</h2>
        <pre>${escapeHtml(`Refresh token securely stored (${tokenHint})`)}</pre>
      </div>
      <p>Access token returned: ${accessToken ? "yes" : "no"}</p>
      <p><a href="${escapeHtml(state.returnTo)}">Continue</a></p>
    </main>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  } catch (exchangeError) {
    const message =
      exchangeError instanceof Error
        ? exchangeError.message
        : "Failed to exchange OAuth code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}