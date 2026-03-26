import { z, ZodError } from "zod";

import { getToolRegistry } from "@/lib/mcp/registry";
import {
  mcpJsonRpcRequestSchema,
  mcpRequestSchema,
  type JsonRpcId,
  type McpToolContext,
} from "@/lib/mcp/types";

const TOOL_CALL_PARAMS_SCHEMA = mcpRequestSchema.extend({
  tool: mcpRequestSchema.shape.tool,
  input: mcpRequestSchema.shape.input.optional(),
});

const DEFAULT_PROTOCOL_VERSION = "2025-11-25";

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: "2.0" as const,
    id,
    result,
  };
}

function jsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  return {
    jsonrpc: "2.0" as const,
    id,
    error: {
      code,
      message,
      data,
    },
  };
}

type ExecuteToolResult = {
  ok: boolean;
  status: number;
  content?: string;
  data?: unknown;
  error?: string;
  issues?: unknown;
  toolName?: string;
};

function normalizeToolName(toolName: string): string {
  const aliasMap: Record<string, string> = {
    "email.send": "email_send",
    "email.read": "email_read",
    "email.summarize": "email_summarize",
    "email.reply": "email_reply",
  };

  return aliasMap[toolName] ?? toolName;
}

async function executeTool(
  toolName: string,
  input: unknown,
  context: McpToolContext,
): Promise<ExecuteToolResult> {
  const registry = getToolRegistry();
  const normalizedToolName = normalizeToolName(toolName);
  const tool = registry.get(normalizedToolName);

  if (!tool) {
    return {
      ok: false,
      status: 404,
      error: `Unknown tool: ${toolName}`,
    };
  }

  try {
    const parsedInput = tool.inputSchema.parse(input ?? {});
    const result = await tool.execute(parsedInput, context);

    return {
      ok: true,
      status: 200,
      content: result.content,
      data: result.data,
      toolName: tool.name,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        status: 400,
        error: "Invalid input",
        issues: error.flatten(),
      };
    }

    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function isMcpJsonRpcRequest(rawBody: unknown): boolean {
  return mcpJsonRpcRequestSchema.safeParse(rawBody).success;
}

type JsonRpcOptions = {
  apiKey: string;
  refreshToken: string | null;
  getAuthUrl: () => string;
  serverVersion?: string;
};

export async function executeMcpJsonRpcRequest(rawBody: unknown, options: JsonRpcOptions) {
  const parsed = mcpJsonRpcRequestSchema.safeParse(rawBody);

  if (!parsed.success) {
    return {
      status: 400,
      body: jsonRpcError(null, -32600, "Invalid Request", parsed.error.flatten()),
    };
  }

  const request = parsed.data;
  const id = request.id ?? null;

  switch (request.method) {
    case "initialize": {
      const clientParams =
        typeof request.params === "object" && request.params !== null
          ? (request.params as { protocolVersion?: string })
          : {};

      return {
        status: 200,
        body: jsonRpcResult(id, {
          protocolVersion: clientParams.protocolVersion ?? DEFAULT_PROTOCOL_VERSION,
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
          serverInfo: {
            name: "zemail",
            version: options.serverVersion ?? "0.1.0",
          },
        }),
      };
    }
    case "notifications/initialized": {
      return {
        status: 202,
        body: null,
      };
    }
    case "tools/list": {
      const registry = getToolRegistry();
      const tools = [...registry.values()].map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: z.toJSONSchema(tool.inputSchema),
      }));

      return {
        status: 200,
        body: jsonRpcResult(id, { tools }),
      };
    }
    case "tools/call": {
      const paramsResult = TOOL_CALL_PARAMS_SCHEMA.safeParse({
        tool:
          typeof request.params === "object" && request.params !== null
            ? (request.params as { name?: unknown }).name
            : undefined,
        input:
          typeof request.params === "object" && request.params !== null
            ? (request.params as { arguments?: unknown }).arguments
            : undefined,
      });

      if (!paramsResult.success) {
        return {
          status: 400,
          body: jsonRpcError(id, -32602, "Invalid params", paramsResult.error.flatten()),
        };
      }

      if (!options.refreshToken) {
        const authUrl = options.getAuthUrl();

        return {
          status: 200,
          body: jsonRpcResult(id, {
            isError: true,
            content: [
              {
                type: "text",
                text: `Google OAuth is required before using email tools. Open: ${authUrl}`,
              },
            ],
            structuredContent: {
              error: "auth_required",
              authUrl,
            },
          }),
        };
      }

      const executed = await executeTool(paramsResult.data.tool, paramsResult.data.input, {
        apiKey: options.apiKey,
        refreshToken: options.refreshToken,
      });

      if (!executed.ok) {
        return {
          status: executed.status === 404 ? 200 : executed.status,
          body:
            executed.status === 404
              ? jsonRpcResult(id, {
                  isError: true,
                  content: [
                    {
                      type: "text",
                      text: executed.error ?? "Unknown tool",
                    },
                  ],
                })
              : jsonRpcError(id, -32000, executed.error ?? "Tool execution failed", executed.issues),
        };
      }

      return {
        status: 200,
        body: jsonRpcResult(id, {
          content: [
            {
              type: "text",
              text: executed.content ?? "Tool executed successfully",
            },
          ],
          structuredContent: executed.data,
        }),
      };
    }
    case "ping": {
      return {
        status: 200,
        body: jsonRpcResult(id, {}),
      };
    }
    default: {
      return {
        status: 404,
        body: jsonRpcError(id, -32601, `Method not found: ${request.method}`),
      };
    }
  }
}

export async function executeMcpRequest(rawBody: unknown, context: McpToolContext) {
  const parsed = mcpRequestSchema.parse(rawBody);
  const result = await executeTool(parsed.tool, parsed.input, context);

  if (!result.ok) {
    return {
      ok: false as const,
      status: result.status,
      body: {
        error: result.error ?? "Unexpected request failure",
        ...(result.issues ? { issues: result.issues } : {}),
      },
    };
  }

  return {
    ok: true as const,
    status: 200,
    body: {
      tool: result.toolName,
      content: result.content,
      data: result.data,
    },
  };
}