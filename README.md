# Zemail

Email operations for AI agents via MCP.

Zemail is a client-agnostic MCP-style server built on Next.js that exposes four tools:

- `email.send`
- `email.read`
- `email.summarize`
- `email.reply`

## API Endpoint

- `POST /api/mcp` executes a tool
- `GET /api/mcp` returns tool metadata
- `POST /api/mcp` also supports MCP JSON-RPC (`initialize`, `tools/list`, `tools/call`)

## Tool Contracts

### `email.send`

```json
{
	"tool": "email.send",
	"input": {
		"to": "user@example.com",
		"subject": "Hello",
		"body": "Test email"
	}
}
```

### `email.read`

```json
{
	"tool": "email.read",
	"input": {
		"limit": 5
	}
}
```

### `email.summarize`

```json
{
	"tool": "email.summarize",
	"input": {
		"emailId": "18d8f64c0f8b1234"
	}
}
```

### `email.reply`

```json
{
	"tool": "email.reply",
	"input": {
		"emailId": "18d8f64c0f8b1234"
	}
}
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `MCP_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN` (optional fallback for persistent server setup)
- `GOOGLE_REDIRECT_URI`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional; defaults to `gpt-4o-mini`)

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

If `GOOGLE_REFRESH_TOKEN` is not set, Zemail will return `auth_required` with an `authUrl` from `/api/mcp`.

1. Call `/api/mcp` once.
2. Open the returned `authUrl` in a browser.
3. Complete Google consent.
4. Token is linked to your MCP API key for the current server runtime.
5. Re-run your MCP call.

Note: runtime-linked tokens are in-memory. A cold start/redeploy clears them.

### Authenticate from Main Page

Use this route to connect Google from the website and link auth to your MCP API key runtime session:

```txt
/api/auth/google/connect
```

### Generate and Save Refresh Token (Persistent)

1. Deploy your app and configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.
2. Optionally set `OAUTH_SETUP_KEY` to protect setup routes.
3. Open:

```txt
https://myzemail.vercel.app/api/auth/google/start?returnTo=/
```

If `OAUTH_SETUP_KEY` is set:

```txt
https://myzemail.vercel.app/api/auth/google/start?setupKey=YOUR_KEY&returnTo=/
```

4. Complete Google consent.
5. Copy the refresh token shown on the callback page into `GOOGLE_REFRESH_TOKEN` in Vercel env vars.

## Local Run

```bash
npm install
npm run dev
```

## Example Request

```bash
curl -X POST http://localhost:3000/api/mcp \
	-H "Content-Type: application/json" \
	-H "x-api-key: your-mcp-api-key" \
	-d '{"tool":"email.read","input":{"limit":5}}'
```
