type AuthTicket = {
  apiKey: string;
  expiresAt: number;
};

type RuntimeStore = {
  tickets: Map<string, AuthTicket>;
  refreshTokensByApiKey: Map<string, string>;
};

declare global {
  var __zemailOauthStore__: RuntimeStore | undefined;
}

function getStore(): RuntimeStore {
  if (!globalThis.__zemailOauthStore__) {
    globalThis.__zemailOauthStore__ = {
      tickets: new Map(),
      refreshTokensByApiKey: new Map(),
    };
  }

  return globalThis.__zemailOauthStore__;
}

function randomId(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function createAuthTicket(apiKey: string): string {
  const store = getStore();
  const ticket = randomId();

  store.tickets.set(ticket, {
    apiKey,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return ticket;
}

export function consumeAuthTicket(ticket: string): string | null {
  const store = getStore();
  const match = store.tickets.get(ticket);

  store.tickets.delete(ticket);

  if (!match || match.expiresAt < Date.now()) {
    return null;
  }

  return match.apiKey;
}

export function setApiKeyRefreshToken(apiKey: string, refreshToken: string) {
  const store = getStore();
  store.refreshTokensByApiKey.set(apiKey, refreshToken);
}

export function getApiKeyRefreshToken(apiKey: string): string | null {
  const store = getStore();
  return store.refreshTokensByApiKey.get(apiKey) ?? null;
}