import { z } from "zod";

export type McpResponse = {
  content: string;
  data?: unknown;
};

export type McpToolContext = {
  apiKey: string;
  refreshToken: string;
};

export type McpTool<TInput extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  description: string;
  inputSchema: TInput;
  execute: (
    input: z.infer<TInput>,
    context: McpToolContext,
  ) => Promise<McpResponse>;
};

export const mcpRequestSchema = z.object({
  tool: z.string().min(1),
  input: z.unknown().optional(),
});

export type McpRequest = z.infer<typeof mcpRequestSchema>;

export const jsonRpcIdSchema = z.union([z.string(), z.number(), z.null()]);

export const mcpJsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: jsonRpcIdSchema.optional(),
  method: z.string().min(1),
  params: z.unknown().optional(),
});

export type JsonRpcId = z.infer<typeof jsonRpcIdSchema>;
export type McpJsonRpcRequest = z.infer<typeof mcpJsonRpcRequestSchema>;