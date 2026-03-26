import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

type TicketPayload = {
  userId: string;
  expiresAt: number;
  nonce: string;
};

function getSigningKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Missing required environment variable: APP_ENCRYPTION_KEY");
  }

  const normalized = raw.trim();
  const key = normalized.includes("=")
    ? Buffer.from(normalized, "base64")
    : Buffer.from(normalized, "base64url");

  if (key.length !== 32) {
    throw new Error(
      "APP_ENCRYPTION_KEY must be 32 bytes encoded as base64/base64url",
    );
  }

  return key;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getSigningKey())
    .update(encodedPayload)
    .digest("base64url");
}

export function createAuthTicket(userId: string): string {
  const payload: TicketPayload = {
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000,
    nonce: randomUUID().replaceAll("-", ""),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url",
  );
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function consumeAuthTicket(ticket: string): string | null {
  const [encodedPayload, signature] = ticket.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature, "utf-8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    ) as TicketPayload;

    if (!payload.userId || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}