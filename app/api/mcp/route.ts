import { ZodError } from "zod";

import { resolveUserByApiKey, touchApiKeyUsage } from "@/lib/auth/apiKeys";
import { getUserGoogleRefreshToken } from "@/lib/auth/googleConnections";
import { createAuthTicket } from "@/lib/google/oauthSessionStore";
import { getToolManifest } from "@/lib/mcp/registry";
import {
  executeMcpJsonRpcRequest,
  executeMcpRequest,
  isMcpJsonRpcRequest,
} from "@/lib/mcp/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getApiKey(request: Request): string | null {
  const header = request.headers.get("x-api-key");
  return header && header.trim() ? header : null;
}

function getEnvRefreshToken(): string | null {
  const envToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (envToken) {
    return envToken;
  }

  return null;
}

async function resolveRequestIdentity(request: Request): Promise<{
  userId: string;
  apiKeyId?: string;
} | null> {
  const headerApiKey = getApiKey(request);

  if (headerApiKey) {
    const identity = await resolveUserByApiKey(headerApiKey);
    if (!identity) {
      return null;
    }

    return {
      userId: identity.userId,
      apiKeyId: identity.keyId,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
  };
}

export async function GET() {
  return Response.json({
    service: "zemail",
    endpoint: "/api/mcp",
    tools: getToolManifest(),
  });
}

export async function POST(request: Request) {
  const identity = await resolveRequestIdentity(request);
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const refreshToken =
      getEnvRefreshToken() ?? (await getUserGoogleRefreshToken(identity.userId));

    const createAuthUrl = () => {
      const ticket = createAuthTicket(identity.userId);
      const origin = new URL(request.url).origin;
      const params = new URLSearchParams({
        ticket,
        returnTo: "/",
      });

      if (process.env.OAUTH_SETUP_KEY) {
        params.set("setupKey", process.env.OAUTH_SETUP_KEY);
      }

      return `${origin}/api/auth/google/start?${params.toString()}`;
    };

    if (isMcpJsonRpcRequest(body)) {
      const result = await executeMcpJsonRpcRequest(body, {
        userId: identity.userId,
        apiKeyId: identity.apiKeyId,
        refreshToken,
        getAuthUrl: createAuthUrl,
      });

      if (identity.apiKeyId) {
        await touchApiKeyUsage(identity.apiKeyId);
      }

      if (result.body === null) {
        return new Response(null, { status: result.status });
      }

      return Response.json(result.body, { status: result.status });
    }

    if (!refreshToken) {
      return Response.json(
        {
          error: "auth_required",
          content: "Google OAuth is required before using email tools.",
          authUrl: createAuthUrl(),
        },
        { status: 428 },
      );
    }

    const result = await executeMcpRequest(body, {
      userId: identity.userId,
      apiKeyId: identity.apiKeyId,
      refreshToken,
    });

    if (identity.apiKeyId) {
      await touchApiKeyUsage(identity.apiKeyId);
    }

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