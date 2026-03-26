import { ZodError } from "zod";

import { getToolRegistry } from "@/lib/mcp/registry";
import { mcpRequestSchema, type McpToolContext } from "@/lib/mcp/types";

export async function executeMcpRequest(rawBody: unknown, context: McpToolContext) {
  const parsed = mcpRequestSchema.parse(rawBody);
  const registry = getToolRegistry();
  const tool = registry.get(parsed.tool);

  if (!tool) {
    return {
      ok: false as const,
      status: 404,
      body: {
        error: `Unknown tool: ${parsed.tool}`,
      },
    };
  }

  try {
    const input = tool.inputSchema.parse(parsed.input ?? {});
    const result = await tool.execute(input, context);

    return {
      ok: true as const,
      status: 200,
      body: {
        tool: tool.name,
        ...result,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false as const,
        status: 400,
        body: {
          error: "Invalid input",
          issues: error.flatten(),
        },
      };
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      ok: false as const,
      status: 500,
      body: {
        error: message,
      },
    };
  }
}