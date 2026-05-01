import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { signup, me } from "../api/auth";
import { useAuth } from "../store/auth";

export default function SignupPage() {
  const [params] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState(params.get("code") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTokens, setUser } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c);
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, hyphen, underscore"); return;
    }
    setBusy(true);
    try {
      const tokens = await signup(username, password, code.trim());
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await me();
      setUser(user);
      nav("/", { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 400 && detail) setError(detail);
      else if (status === 409) setError(detail ?? "Username already taken");
      else if (status === 429) setError("Too many attempts. Try again later.");
      else setError("Could not create account. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                        bg-photo/[0.04] rounded-full blur-3xl" />
      </div>

      <form onSubmit={onSubmit}
            className="relative w-full max-w-sm card-raised p-8 animate-slide-up">
        <h1 className="display text-3xl mb-1">Create account</h1>
        <p className="text-muted text-sm mb-7">
          Invite-only. Paste the code your admin shared.
        </p>

        <label className="block text-xs uppercase tracking-wider text-faint mb-2">Invite code</label>
        <input type="text" autoComplete="off" required value={code}
               onChange={(e) => setCode(e.target.value)}
               placeholder="paste invite code"
               className="input mb-4 font-mono text-sm" />

        <label className="block text-xs uppercase tracking-wider text-faint mb-2">Username</label>
        <input type="text" autoComplete="username" autoFocus={!params.get("code")}
               required minLength={3} maxLength={64}
               value={username} onChange={(e) => setUsername(e.target.value)}
               className="input mb-4" />

        <label className="block text-xs uppercase tracking-wider text-faint mb-2">Password</label>
        <input type="password" autoComplete="new-password" required minLength={8}
               value={password} onChange={(e) => setPassword(e.target.value)}
               className="input mb-4" />

        <label className="block text-xs uppercase tracking-wider text-faint mb-2">Confirm</label>
        <input type="password" autoComplete="new-password" required minLength={8}
               value={confirm} onChange={(e) => setConfirm(e.target.value)}
               className="input mb-5" />

        {error && (
          <div className="mb-5 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        <button type="submit" disabled={busy || !username || !password || !confirm || !code}
                className="btn-primary w-full py-2.5">
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className="mt-6 text-sm text-muted text-center">
          Already have one?{" "}
          <Link to="/login" className="text-accent hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
