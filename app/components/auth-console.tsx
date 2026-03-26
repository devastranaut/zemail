"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { KeyRound, LogOut, Mail, Plus, ShieldCheck, MailWarning, Copy, Check, ExternalLink, Trash2, Eye, EyeOff } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ApiKeyItem = {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export function AuthConsole() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; type: "idle" | "success" | "error" | "loading" }>({
    message: "Checking authentication...",
    type: "loading",
  });
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [latestKey, setLatestKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [revealLatestKey, setRevealLatestKey] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailStatusLoading, setGmailStatusLoading] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const mcpApiKey = latestKey ?? "PASTE_YOUR_USER_MCP_KEY_HERE";
  const mcpConfigSnippet = `{
  "servers": {
    "custom": {
      "url": "https://myzemail.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "${mcpApiKey}"
      },
      "notes": "Sign in at https://myzemail.vercel.app, connect Gmail once, then invoke tools."
    }
  }
}`;

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient());
  }, []);

  const loadSession = useCallback(async () => {
    if (!supabase) return;

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      setStatus({ message: error.message, type: "error" });
      setUserEmail(null);
      setKeys([]);
      return;
    }

    setUserEmail(user?.email ?? null);
    if (!user) {
      setStatus({ message: "Sign in to manage your MCP keys", type: "idle" });
    } else {
      setStatus({ message: "Authenticated securely", type: "success" });
    }
  }, [supabase]);

  const loadKeys = useCallback(async () => {
    const response = await fetch("/api/auth/mcp-key", { method: "GET", cache: "no-store" });
    if (!response.ok) {
      setKeys([]);
      return;
    }
    const data = (await response.json()) as { keys?: ApiKeyItem[] };
    setKeys(data.keys ?? []);
  }, []);

  const loadGmailStatus = useCallback(async () => {
    setGmailStatusLoading(true);
    try {
      const response = await fetch("/api/auth/google/status", { method: "GET", cache: "no-store" });
      if (!response.ok) {
        setGmailConnected(false);
        return;
      }

      const data = (await response.json()) as { connected?: boolean };
      setGmailConnected(Boolean(data.connected));
    } finally {
      setGmailStatusLoading(false);
    }
  }, []);

  async function revokeApiKey(keyId: string) {
    setDeletingKeyId(keyId);
    try {
      const response = await fetch("/api/auth/mcp-key", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyId }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setStatus({ message: data.error ?? "Failed to delete key", type: "error" });
        return;
      }

      setStatus({ message: "API key deleted", type: "success" });
      await loadKeys();
    } catch {
      setStatus({ message: "Network error deleting key", type: "error" });
    } finally {
      setDeletingKeyId(null);
    }
  }

  useEffect(() => {
    if (!supabase) return;
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void loadSession();
    });
    return () => subscription.unsubscribe();
  }, [loadSession, supabase]);

  useEffect(() => {
    if (userEmail) {
      void loadKeys();
      void loadGmailStatus();
      return;
    }
    setKeys([]);
    setGmailConnected(false);
  }, [loadGmailStatus, loadKeys, userEmail]);

  async function signUp() {
    if (!supabase) return;
    setStatus({ message: "Creating your account...", type: "loading" });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setStatus({ message: error.message, type: "error" });
    else setStatus({ message: "Account created! Check your email", type: "success" });
  }

  async function signIn() {
    if (!supabase) return;
    setStatus({ message: "Signing in...", type: "loading" });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus({ message: error.message, type: "error" });
      return;
    }
    setStatus({ message: "Successfully signed in", type: "success" });
    await loadSession();
  }

  async function signOut() {
    if (!supabase) return;
    setStatus({ message: "Signing out...", type: "loading" });
    const { error } = await supabase.auth.signOut();
    setStatus({ message: "Successfully signed out", type: "success" });
    setLatestKey(null);
    await loadSession();
  }

  async function createApiKey() {
    if (!keyName.trim()) {
      setStatus({ message: "Key name is required", type: "error" });
      return;
    }
    setStatus({ message: "Generating secure key...", type: "loading" });
    
    try {
      const response = await fetch("/api/auth/mcp-key", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: keyName || undefined }),
      });
      const data = (await response.json()) as { error?: string; apiKey?: string; key?: ApiKeyItem };

      if (!response.ok || !data.apiKey) {
        setStatus({ message: data.error ?? "Failed to create key", type: "error" });
        return;
      }

      setLatestKey(data.apiKey);
      setRevealLatestKey(false);
      setStatus({ message: "New key activated", type: "success" });
      setKeyName("");
      setCopied(false);
      await loadKeys();
    } catch (error) {
      setStatus({ message: "Network error creating key", type: "error" });
    }
  }

  const handleCopy = () => {
    if (latestKey) {
      navigator.clipboard.writeText(latestKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(mcpConfigSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-1">
      <div className="rounded-xl bg-zinc-950 p-6 md:p-8">
        
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-100">
              {userEmail ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : <MailWarning className="h-5 w-5 text-amber-500" />}
              {userEmail ? "Developer Dashboard" : "Sign In to proceed"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {status.message}
            </p>
          </div>
          {userEmail && (
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          )}
        </div>

        {/* Not Logged In */}
        {!userEmail ? (
          <div className="mx-auto max-w-sm space-y-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="agent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 focus:border-emerald-500 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 focus:border-emerald-500 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={signIn}
                className="flex-1 rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white active:bg-zinc-200"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={signUp}
                className="flex-1 rounded-lg border border-zinc-700 bg-transparent py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 active:bg-zinc-900"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Workspace */
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Action Bar */}
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">{userEmail}</p>
                <p className="text-xs text-zinc-500">
                  {gmailStatusLoading
                    ? "Checking Gmail connection..."
                    : gmailConnected
                    ? "Gmail source connected"
                    : "Gmail source not connected"}
                </p>
              </div>
              <a
                href="/api/auth/google/connect"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20 active:bg-indigo-500/30"
              >
                <ExternalLink className="h-4 w-4" />
                {gmailConnected ? "Reconnect Gmail Source" : "Connect Gmail Source"}
              </a>
            </div>

            <hr className="border-zinc-800/80" />

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-zinc-100">MCP client config</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Use this after connecting Gmail. Replace the placeholder if needed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  {copiedConfig ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedConfig ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">
                {mcpConfigSnippet}
              </pre>
            </div>

            {/* Key Management */}
            <div>
              <h3 className="text-sm font-medium text-zinc-100 mb-4">API Key Management</h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. Production Agent Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={createApiKey}
                  disabled={!keyName.trim() || status.type === 'loading'}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  Generate Key
                </button>
              </div>

              {/* Reveal New Key */}
              {latestKey && (
                <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Your new API key</p>
                    <span className="text-xs text-emerald-500/80">Copy it now, you won't see it again</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="block flex-1 overflow-x-auto rounded border border-emerald-500/20 bg-emerald-950/50 p-2.5 text-sm text-emerald-300 outline-none">
                      {revealLatestKey ? latestKey : `${"*".repeat(24)}${latestKey.slice(-6)}`}
                    </code>
                    <button
                      onClick={() => setRevealLatestKey((value) => !value)}
                      className="shrink-0 rounded bg-emerald-500/20 p-2.5 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 transition-colors"
                      title={revealLatestKey ? "Hide key" : "Show key"}
                    >
                      {revealLatestKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 rounded bg-emerald-500/20 p-2.5 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Keys List */}
              <div className="mt-6 space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-800/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{key.name ?? "Unnamed Key"}</p>
                      <p className="mt-1 font-mono text-[10px] text-zinc-500">Key ID: {key.id.slice(0, 8)}...{key.id.slice(-6)}</p>
                    </div>
                    <div className="flex flex-col sm:items-end text-xs text-zinc-500 gap-1.5">
                      <p>Created: <span className="text-zinc-400">{new Date(key.createdAt).toLocaleDateString()}</span></p>
                      <p>Last use: <span className="text-zinc-400">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}</span></p>
                      <button
                        type="button"
                        onClick={() => revokeApiKey(key.id)}
                        disabled={deletingKeyId === key.id}
                        className="inline-flex items-center gap-1 rounded border border-red-500/40 px-2 py-1 text-[11px] text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingKeyId === key.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
                
                {keys.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
                    No API keys active for this project yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
