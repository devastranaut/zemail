import { google, gmail_v1 } from "googleapis";

export type EmailMessage = {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function extractText(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) {
    return "";
  }

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  for (const part of payload.parts ?? []) {
    const text = extractText(part);
    if (text) {
      return text;
    }
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return "";
}

function getHeader(
  payload: gmail_v1.Schema$MessagePart | undefined,
  name: string,
): string {
  const header = payload?.headers?.find(
    (item) => item.name?.toLowerCase() === name.toLowerCase(),
  );

  return header?.value ?? "";
}

function toEmailMessage(message: gmail_v1.Schema$Message): EmailMessage {
  const payload = message.payload;

  return {
    id: message.id ?? "",
    threadId: message.threadId ?? undefined,
    subject: getHeader(payload, "Subject"),
    from: getHeader(payload, "From"),
    to: getHeader(payload, "To"),
    date: getHeader(payload, "Date"),
    snippet: message.snippet ?? "",
    body: extractText(payload),
  };
}

function getGmailClient(refreshToken: string) {
  const oauth2 = new google.auth.OAuth2(
    getEnv("GOOGLE_CLIENT_ID"),
    getEnv("GOOGLE_CLIENT_SECRET"),
    process.env.GOOGLE_REDIRECT_URI ?? "https://developers.google.com/oauthplayground",
  );

  oauth2.setCredentials({
    refresh_token: refreshToken,
  });

  return google.gmail({
    version: "v1",
    auth: oauth2,
  });
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
}, refreshToken: string): Promise<{ id: string | null }>
{
  const gmail = getGmailClient(refreshToken);
  const messageLines = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    params.body,
  ];

  const raw = Buffer.from(messageLines.join("\n")).toString("base64url");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return { id: response.data.id ?? null };
}

export async function readLatestEmails(
  refreshToken: string,
  limit = 10,
): Promise<EmailMessage[]> {
  const gmail = getGmailClient(refreshToken);
  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: Math.min(Math.max(limit, 1), 25),
    labelIds: ["INBOX"],
  });

  const messageIds = list.data.messages ?? [];
  if (messageIds.length === 0) {
    return [];
  }

  const details = await Promise.all(
    messageIds.map((message) =>
      gmail.users.messages.get({
        userId: "me",
        id: message.id ?? "",
        format: "full",
      }),
    ),
  );

  return details.map((result) => toEmailMessage(result.data));
}

export async function readEmailById(
  emailId: string,
  refreshToken: string,
): Promise<EmailMessage> {
  const gmail = getGmailClient(refreshToken);
  const response = await gmail.users.messages.get({
    userId: "me",
    id: emailId,
    format: "full",
  });

  if (!response.data.id) {
    throw new Error(`Email not found for id: ${emailId}`);
  }

  return toEmailMessage(response.data);
}