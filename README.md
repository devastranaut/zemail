# Zemail

Email operations for AI agents via MCP.

Zemail is a client-agnostic MCP-style server built on Next.js that exposes four tools:

- `email_send`
- `email_read`
- `email_summarize`
- `email_reply`

## Multi-user Architecture

- User signup/login is handled by Supabase Auth.
- Every user can create their own MCP API keys.
- Every user connects their own Google account.
- Google refresh tokens are encrypted before storage.
- MCP calls are resolved to a user via `x-api-key` (recommended for agents) or Supabase session cookies.

Recommended identity strategy:

- Use per-user MCP API keys for external MCP clients and agents.
- Use Supabase user IDs as the internal identity key.
- Never use a single global API key for all users.

## API Endpoint

- `POST /api/mcp` executes a tool
- `GET /api/mcp` returns tool metadata
- `POST /api/mcp` also supports MCP JSON-RPC (`initialize`, `tools/list`, `tools/call`)
- `GET /api/auth/mcp-key` lists keys for the signed-in user
- `POST /api/auth/mcp-key` creates a new key for the signed-in user

Legacy dot-style names are still accepted for compatibility:

- `email.send` -> `email_send`
- `email.read` -> `email_read`
- `email.summarize` -> `email_summarize`
- `email.reply` -> `email_reply`

## Tool Contracts

### `email_send`

```json
{
	"tool": "email_send",
	"input": {
		"to": "user@example.com",
		"subject": "Hello",
		"body": "Test email"
	}
}
```

### `email_read`

```json
{
	"tool": "email_read",
	"input": {
		"limit": 5
	}
}
```

### `email_summarize`

```json
{
	"tool": "email_summarize",
	"input": {
		"emailId": "18d8f64c0f8b1234"
	}
}
```

### `email_reply`

```json
{
	"tool": "email_reply",
	"input": {
		"emailId": "18d8f64c0f8b1234"
	}
}
```

## Environment Variables

Configure `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ENCRYPTION_KEY` (32-byte key encoded as base64/base64url)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `OAUTH_SETUP_KEY` (optional guard for `/api/auth/google/start`)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional; defaults to `gpt-4o-mini`)
- `GOOGLE_REFRESH_TOKEN` (optional global fallback; mainly for single-user/dev)

Generate a valid encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password auth in Supabase Auth settings.
3. Run [docs/supabase.sql](docs/supabase.sql) in Supabase SQL Editor.
4. Add your app URL to Supabase Auth URL configuration.

## Gmail Setup Notes

Use Google Cloud OAuth2 credentials with scopes:

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`

The server authenticates Gmail requests with OAuth2 and a refresh token.

### Redirect URI for Deployment

Set this exact redirect URI in Google Cloud OAuth client settings:

- `https://myzemail.vercel.app/api/auth/google/callback`

Then set the same value in `GOOGLE_REDIRECT_URI`.

### First-run Auth Flow (No Refresh Token Env Needed)

If no per-user Google refresh token is available, Zemail returns `auth_required` with an `authUrl`.

1. Sign in on the website.
2. Create an MCP key.
3. Call `/api/mcp` once using that key.
2. Open the returned `authUrl` in a browser.
3. Complete Google consent.
4. Token is securely stored and linked to your user.
5. Re-run your MCP call.

### Authenticate from Main Page

Use this route to connect Google from the website for the signed-in user:

```txt
/api/auth/google/connect
```

## Local Run

```bash
npm install
npm run dev
```

## Example Request

```bash
curl -X POST http://localhost:3000/api/mcp \
	-H "Content-Type: application/json" \
	-H "x-api-key: YOUR_USER_MCP_KEY" \
	-d '{"tool":"email_read","input":{"limit":5}}'
```
