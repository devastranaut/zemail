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