"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  const [status, setStatus] = useState<string>("Not signed in");
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [latestKey, setLatestKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");

  useEffect(() => {
    setSupabase(getSupabaseBrowserClient());
  }, []);

  const loadSession = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      setStatus(error.message);
      setUserEmail(null);
      setKeys([]);
      return;
    }

    setUserEmail(user?.email ?? null);
    setStatus(user ? `Signed in as ${user.email}` : "Not signed in");
  }, [supabase]);

  const loadKeys = useCallback(async () => {
    const response = await fetch("/api/auth/mcp-key", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      setKeys([]);
      return;
    }

    const data = (await response.json()) as { keys?: ApiKeyItem[] };
    setKeys(data.keys ?? []);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSession, supabase]);

  useEffect(() => {
    if (userEmail) {
      void loadKeys();
      return;
    }

    setKeys([]);
  }, [loadKeys, userEmail]);

  async function signUp() {
    if (!supabase) {
      setStatus("Supabase client not ready");
      return;
    }

    setStatus("Creating account...");
    const { error } = await supabase.auth.signUp({ email, password });
    setStatus(error ? error.message : "Account created. Check your email for confirmation.");
  }

  async function signIn() {
    if (!supabase) {
      setStatus("Supabase client not ready");
      return;
    }

    setStatus("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Signed in");
    await loadSession();
  }

  async function signOut() {
    if (!supabase) {
      setStatus("Supabase client not ready");
      return;
    }

    const { error } = await supabase.auth.signOut();
    setStatus(error ? error.message : "Signed out");
    setLatestKey(null);
    await loadSession();
  }

  async function createApiKey() {
    setStatus("Creating MCP key...");
    const response = await fetch("/api/auth/mcp-key", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: keyName || undefined }),
    });

    const data = (await response.json()) as {
      error?: string;
      apiKey?: string;
      key?: ApiKeyItem;
    };

    if (!response.ok || !data.apiKey) {
      setStatus(data.error ?? "Failed to create key");
      return;
    }

    setLatestKey(data.apiKey);
    setStatus("MCP key created. Save it now; it is only shown once.");
    setKeyName("");
    await loadKeys();
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="mb-2 text-lg font-medium text-white">User Auth and MCP Keys</h2>
      <p className="mb-4 text-sm text-zinc-300">{status}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={signUp}
          className="rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={signIn}
          className="rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100"
        >
          Sign out
        </button>
      </div>

      {userEmail ? (
        <div className="mt-6 space-y-3 border-t border-zinc-800 pt-4">
          <p className="text-sm text-zinc-300">
            Signed in user: <strong>{userEmail}</strong>
          </p>
          <a
            href="/api/auth/google/connect"
            className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
          >
            Connect Google account
          </a>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              placeholder="Key label (optional)"
              value={keyName}
              onChange={(event) => setKeyName(event.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
            />
            <button
              type="button"
              onClick={createApiKey}
              className="rounded-lg border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
            >
              Generate MCP key
            </button>
          </div>

          {latestKey ? (
            <pre className="overflow-x-auto rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs text-emerald-300">
              {latestKey}
            </pre>
          ) : null}

          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300"
              >
                <p>ID: {key.id}</p>
                <p>Name: {key.name ?? "(none)"}</p>
                <p>Created: {new Date(key.createdAt).toLocaleString()}</p>
                <p>Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "never"}</p>
              </div>
            ))}
            {keys.length === 0 ? <p className="text-xs text-zinc-400">No MCP keys yet.</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
