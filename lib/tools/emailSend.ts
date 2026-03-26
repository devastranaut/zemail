import { z } from "zod";

import { sendEmail } from "@/lib/google/gmailClient";
import type { McpTool } from "@/lib/mcp/types";

const inputSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const emailSendTool: McpTool<typeof inputSchema> = {
  name: "email_send",
  description: "Send an email via Gmail",
  inputSchema,
  async execute(input, context) {
    const result = await sendEmail(input, context.refreshToken);

    return {
      content: "Email sent successfully",
      data: { messageId: result.id },
    };
  },
};