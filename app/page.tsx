export default function Home() {
  return (
    <div className="flex flex-1 bg-zinc-950 text-zinc-100">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-14 sm:px-10 sm:py-18">
        <header className="space-y-4">
          <p className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-300">
            Zemail
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Email operations for AI agents via MCP
          </h1>
          <p className="max-w-2xl text-zinc-300">
            This project exposes an MCP-style endpoint at /api/mcp with four core
            tools: email.send, email.read, email.summarize, and email.reply.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="mb-2 text-lg font-medium text-white">Authenticate Gmail</h2>
          <p className="mb-4 max-w-2xl text-sm text-zinc-300">
            Before running MCP email tools, connect your Google account once from
            this page.
          </p>
          <a
            href="/api/auth/google/start?returnTo=/"
            className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            Authenticate with Google
          </a>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="mb-3 text-lg font-medium text-white">Quick test</h2>
          <pre className="overflow-x-auto text-sm leading-6 text-zinc-200">
{`curl -X POST http://localhost:3000/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $MCP_API_KEY" \\
  -d '{
    "tool": "email.read",
    "input": { "limit": 5 }
  }'`}
          </pre>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {[
            { name: "email.send", desc: "Send an email via Gmail" },
            { name: "email.read", desc: "Fetch latest inbox emails" },
            { name: "email.summarize", desc: "Summarize an email" },
            { name: "email.reply", desc: "Generate and send a reply" },
          ].map((tool) => (
            <article
              key={tool.name}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <h3 className="font-mono text-sm text-zinc-100">{tool.name}</h3>
              <p className="mt-2 text-sm text-zinc-300">{tool.desc}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
