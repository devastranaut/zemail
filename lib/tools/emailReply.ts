import { z } from "zod";

import { draftReply } from "@/lib/ai/openai";
import { readEmailById, sendEmail } from "@/lib/google/gmailClient";
import type { McpTool } from "@/lib/mcp/types";

const inputSchema = z.object({
  emailId: z.string().min(1),
});

function extractEmailAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  if (match?.[1]) {
    return match[1].trim();
  }

  return value.trim();
}

function replySubject(subject: string): string {
  const trimmed = subject.trim();
  if (/^re:/i.test(trimmed)) {
    return trimmed;
  }

  return `Re: ${trimmed || "Your email"}`;
}

export const emailReplyTool: McpTool<typeof inputSchema> = {
  name: "email.reply",
  description: "Generate and send a reply",
  inputSchema,
  async execute(input, context) {
    const email = await readEmailById(input.emailId, context.refreshToken);
    const generatedBody = await draftReply(email);
    const recipient = extractEmailAddress(email.from);

    const sent = await sendEmail({
      to: recipient,
      subject: replySubject(email.subject),
      body: generatedBody,
    }, context.refreshToken);

    return {
      content: "Reply generated and sent successfully",
      data: {
        emailId: email.id,
        sentMessageId: sent.id,
        to: recipient,
        subject: replySubject(email.subject),
        body: generatedBody,
      },
    };
  },
};