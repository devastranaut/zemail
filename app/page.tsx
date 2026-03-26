import { AuthConsole } from "@/app/components/auth-console";
import { Send, Inbox, FileText, Reply } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 bg-black text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-16 sm:px-12 sm:py-24">
        
        {/* Hero Section */}
        <header className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-400 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            zemail MCP Interface
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-tr from-white to-zinc-500">
            Email operations for <br className="hidden md:block"/> AI agents via MCP
          </h1>
          <p className="mx-auto md:mx-0 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            A production-ready implementation that exposes a Model Context Protocol endpoint at <code className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-sm text-zinc-200">/api/mcp</code>. Power your AI agents with secure, authenticated access to email capabilities.
          </p>
        </header>

        {/* Console / Interactive Area */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AuthConsole />
        </section>

        {/* Documentation / Quick Test Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 md:p-8 backdrop-blur-sm">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-white">Quick Test</h2>   
            <p className="mb-6 text-sm leading-relaxed text-zinc-400">
              Use your active MCP key generated above to test the endpoint via cURL. Your agent will use the same Headers to execute tools.
            </p>
            <div className="group relative">
              <div className="absolute -inset-y-0.5 -inset-x-0.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 opacity-0 blur backdrop-blur-xl transition duration-500 group-hover:opacity-100"></div>
              <pre className="relative overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-950 p-4 text-sm leading-loose text-zinc-300 shadow-2xl">     
{`curl -X POST http://localhost:3000/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_USER_MCP_KEY" \\
  -d '{
    "tool": "email.read",
    "input": { "limit": 5 }
  }'`}
              </pre>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-white">Available Tools</h2>
            <div className="grid gap-4 sm:grid-cols-2 h-full">
              {[
                { name: "email_send", desc: "Compose & send new emails directly from your agent.", icon: <Send className="h-5 w-5 text-emerald-400" /> },
                { name: "email_read", desc: "Fetch and parse latest threads natively.", icon: <Inbox className="h-5 w-5 text-blue-400" /> },
                { name: "email_summarize", desc: "AI-native intelligent summarization.", icon: <FileText className="h-5 w-5 text-purple-400" /> },
                { name: "email_reply", desc: "Draft and dispatch replies in context.", icon: <Reply className="h-5 w-5 text-amber-400" /> },
              ].map((tool) => (
                <article
                  key={tool.name}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5 transition-colors hover:border-zinc-700/80 hover:bg-zinc-800/40"  
                >
                  <header className="flex items-center gap-3">
                    <div className="rounded-lg bg-zinc-950 p-2 shadow-inner">
                      {tool.icon}
                    </div>
                    <h3 className="font-mono text-sm font-semibold text-zinc-100">{tool.name}</h3>  
                  </header>
                  <p className="text-sm leading-relaxed text-zinc-400">{tool.desc}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
        
        <footer className="mt-12 border-t border-zinc-800/60 pt-6 text-center text-sm text-zinc-600">
          <p>Zeppelin Labs &mdash; Zemail Model Context Protocol Interface &copy; {new Date().getFullYear()}</p>
        </footer>
    </div>
  );
}
