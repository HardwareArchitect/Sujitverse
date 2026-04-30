import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login as loginApi, me } from "../api/auth";
import { useAuth } from "../store/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTokens, setUser } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "/";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tokens = await loginApi(username, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await me();
      setUser(user);
      nav(from, { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setError("Invalid username or password");
      else setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-xl"
      >
        <h1 className="text-2xl font-semibold mb-1">sujitverse</h1>
        <p className="text-muted text-sm mb-6">Sign in to your account</p>

        <label className="block text-sm text-muted mb-1">Username</label>
        <input
          type="text"
          autoComplete="username"
          autoFocus
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 px-3 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
        />

        <label className="block text-sm text-muted mb-1">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 bg-bg border border-border rounded-lg focus:border-accent focus:outline-none"
        />

        {error && (
          <div className="mb-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full py-2 rounded-lg bg-accent text-bg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
