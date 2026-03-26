import { z } from "zod";

import { readLatestEmails } from "@/lib/google/gmailClient";
import type { McpTool } from "@/lib/mcp/types";

const inputSchema = z.object({
  limit: z.number().int().min(1).max(25).optional(),
});

export const emailReadTool: McpTool<typeof inputSchema> = {
  name: "email_read",
  description: "Fetch latest emails",
  inputSchema,
  async execute(input, context) {
    const emails = await readLatestEmails(context.refreshToken, input.limit ?? 10);

    return {
      content: `Fetched ${emails.length} email(s)`,
      data: { emails },
    };
  },
};