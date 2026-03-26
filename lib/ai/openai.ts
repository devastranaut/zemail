import OpenAI from "openai";

import type { EmailMessage } from "@/lib/google/gmailClient";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

function compactEmail(email: EmailMessage): string {
  return [
    `From: ${email.from}`,
    `Subject: ${email.subject}`,
    `Date: ${email.date}`,
    "",
    email.body || email.snippet,
  ].join("\n");
}

export async function summarizeEmail(email: EmailMessage): Promise<string> {
  const client = getClient();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    instructions:
      "You summarize emails for operators. Return 3-5 bullet points and one action recommendation.",
    input: compactEmail(email),
  });

  return response.output_text.trim();
}

export async function draftReply(email: EmailMessage): Promise<string> {
  const client = getClient();
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    instructions:
      "You write concise, professional email replies. Output plain text body only with no preamble.",
    input: [
      "Write a reply to this email.",
      "Keep it under 140 words unless complexity requires more detail.",
      "",
      compactEmail(email),
    ].join("\n"),
  });

  return response.output_text.trim();
}