import { z } from "zod";

import { summarizeEmail } from "@/lib/ai/openai";
import { readEmailById } from "@/lib/google/gmailClient";
import type { McpTool } from "@/lib/mcp/types";

const inputSchema = z.object({
  emailId: z.string().min(1),
});

export const emailSummarizeTool: McpTool<typeof inputSchema> = {
  name: "email_summarize",
  description: "Summarize an email",
  inputSchema,
  async execute(input, context) {
    const email = await readEmailById(input.emailId, context.refreshToken);
    const summary = await summarizeEmail(email);

    return {
      content: "Email summarized successfully",
      data: { emailId: email.id, summary },
    };
  },
};