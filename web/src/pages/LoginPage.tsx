import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login as loginApi, me } from "../api/auth";
import { useAuth } from "../store/auth";

function FeatureLine({
  color, title, children,
}: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className={`mt-1 inline-block w-1.5 h-1.5 rounded-full ${color}`} />
      <div>
        <div className="text-sm text-text font-medium">{title}</div>
        <div className="text-sm text-muted leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px]
                        bg-folder/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px]
                        bg-photo/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative grid lg:grid-cols-2 min-h-screen">
        {/* Brand explainer */}
        <div className="flex items-center justify-center px-6 sm:px-12 py-12 lg:py-0
                        order-2 lg:order-1">
          <div className="max-w-md animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <span className="badge text-folder border-folder/30 bg-folder/10">
                Invite-only
              </span>
              <span className="badge">v0.6</span>
            </div>

            <h1 className="display text-4xl sm:text-5xl tracking-tightest leading-[1.05] mb-4">
              Premium private cloud,
              <br />
              <span className="text-folder">hosted on hardware</span>
              <br />
              I built.
            </h1>
            <p className="text-muted text-base leading-relaxed mb-8 max-w-sm">
              A small, careful place for photos, videos and files —
              owned by us, watched by no one, runs on a Pi on my shelf.
            </p>

            <div className="space-y-4">
              <FeatureLine color="bg-folder" title="End-to-end private">
                TLS to the edge, no third-party storage, your files never leave the box.
              </FeatureLine>
              <FeatureLine color="bg-photo" title="Streams big videos">
                Byte-range support means seeking just works, even on phones.
              </FeatureLine>
              <FeatureLine color="bg-video" title="No accounts unless invited">
                Every account starts with a single-use code from the admin.
              </FeatureLine>
            </div>

            <p className="mt-10 text-xs text-faint">
              Built with FastAPI · React · Cloudflare Tunnel · A Raspberry Pi
            </p>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="flex items-center justify-center px-4 sm:px-8 py-12 lg:py-0
                        order-1 lg:order-2 lg:bg-elevated/40 lg:border-l lg:border-border">
          <form onSubmit={onSubmit}
                className="w-full max-w-sm card-raised p-8 animate-slide-up">
            <h2 className="display text-2xl mb-1">sujitverse</h2>
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
      </div>
    </div>
  );
}
