import { ZodError } from "zod";

import {
  createAuthTicket,
  getApiKeyRefreshToken,
} from "@/lib/google/oauthSessionStore";
import { getToolManifest } from "@/lib/mcp/registry";
import { executeMcpRequest } from "@/lib/mcp/server";

function getApiKey(request: Request): string | null {
  const header = request.headers.get("x-api-key");
  return header && header.trim() ? header : null;
}

function authorized(request: Request): boolean {
  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) {
    return false;
  }

  return getApiKey(request) === apiKey;
}

function getRuntimeRefreshToken(apiKey: string): string | null {
  const envToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (envToken) {
    return envToken;
  }

  return getApiKeyRefreshToken(apiKey);
}

export async function GET() {
  return Response.json({
    service: "zemail",
    endpoint: "/api/mcp",
    tools: getToolManifest(),
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json(
      {
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const apiKey = getApiKey(request);
  if (!apiKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refreshToken = getRuntimeRefreshToken(apiKey);
  if (!refreshToken) {
    const ticket = createAuthTicket(apiKey);
    const origin = new URL(request.url).origin;
    const authUrl = `${origin}/api/auth/google/start?ticket=${ticket}&returnTo=/`;

    return Response.json(
      {
        error: "auth_required",
        content: "Google OAuth is required before using email tools.",
        authUrl,
      },
      { status: 428 },
    );
  }

  try {
    const body = await request.json();
    const result = await executeMcpRequest(body, {
      apiKey,
      refreshToken,
    });
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid request",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected request failure";
    return Response.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}