import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
      else if (status === 429) setError("Too many attempts. Try again later.");
      else setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                        bg-folder/[0.04] rounded-full blur-3xl" />
      </div>

      <form onSubmit={onSubmit}
            className="relative w-full max-w-sm card-raised p-8 animate-slide-up">
        <h1 className="display text-3xl mb-1">sujitverse</h1>
        <p className="text-muted text-sm mb-7">Welcome back. Sign in to continue.</p>

        <label className="block text-xs uppercase tracking-wider text-faint mb-2">Username</label>
        <input type="text" autoComplete="username" autoFocus required
               value={username} onChange={(e) => setUsername(e.target.value)}
               className="input mb-4" />

        <label className="block text-xs uppercase tracking-wider text-faint mb-2">Password</label>
        <input type="password" autoComplete="current-password" required
               value={password} onChange={(e) => setPassword(e.target.value)}
               className="input mb-5" />

        {error && (
          <div className="mb-5 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        <button type="submit" disabled={busy || !username || !password}
                className="btn-primary w-full py-2.5">
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-6 text-sm text-muted text-center">
          Have an invite?{" "}
          <Link to="/signup" className="text-accent hover:underline underline-offset-4">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
