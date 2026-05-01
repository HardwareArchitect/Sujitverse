import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listInvites, createInvite, revokeInvite, getStats, type Invite, type Stats } from "../api/admin";
import { useAuth } from "../store/auth";
import { formatDate } from "../lib/format";

export default function AdminInvitesPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [days, setDays] = useState(7);
  const [justCreated, setJustCreated] = useState<Invite | null>(null);

  useEffect(() => {
    if (!user?.is_admin) nav("/", { replace: true });
  }, [user, nav]);

  async function load() {
    setLoading(true);
    try {
      const [inv, st] = await Promise.all([listInvites(), getStats()]);
      setInvites(inv);
      setStats(st);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onCreate() {
    setCreating(true);
    try {
      const inv = await createInvite(days);
      setJustCreated(inv);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Could not create invite");
    } finally {
      setCreating(false);
    }
  }

  async function onRevoke(id: number) {
    if (!confirm("Revoke this invite? It will no longer work.")) return;
    try {
      await revokeInvite(id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Could not revoke");
    }
  }

  function inviteUrl(code: string) {
    return `${window.location.origin}/signup?code=${code}`;
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers / non-https contexts
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
  }

  const statusColor: Record<Invite["status"], string> = {
    active: "text-accent",
    used: "text-muted",
    expired: "text-muted",
    revoked: "text-danger",
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-semibold">sujitverse</Link>
          <span className="text-muted">·</span>
          <span className="text-muted">Invites</span>
        </div>
        <Link to="/" className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition">
          Back to files
        </Link>
      </header>

      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
          <Stat label="Users" value={`${stats.user_count} / ${stats.max_users}`} />
          <Stat label="Slots remaining" value={String(stats.remaining_slots)} />
          <Stat label="Active invites" value={String(invites.filter(i => i.status === "active").length)} />
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <h2 className="font-medium mb-3">Generate new invite</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted">Expires in</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
          <button
            onClick={onCreate}
            disabled={creating || (stats?.remaining_slots ?? 1) <= 0}
            className="px-4 py-1.5 rounded-lg bg-accent text-bg font-medium disabled:opacity-50 transition"
          >
            {creating ? "Creating…" : "Create invite"}
          </button>
        </div>

        {justCreated?.code && (
          <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <div className="text-xs text-muted mb-1">
              Copy this URL now — you won't see the code again.
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl(justCreated.code)}
                className="flex-1 bg-bg border border-border rounded px-2 py-1 text-sm font-mono"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={() => copyToClipboard(inviteUrl(justCreated.code!))}
                className="px-3 py-1 text-sm rounded bg-accent text-bg"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-muted">Loading…</div>
        ) : invites.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted">No invites yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {invites.map((inv) => (
              <li key={inv.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                <span className={`shrink-0 text-sm w-16 ${statusColor[inv.status]}`}>
                  {inv.status}
                </span>
                <span className="flex-1 min-w-0 text-sm">
                  {inv.used_by_username ? (
                    <>Used by <span className="text-text">{inv.used_by_username}</span></>
                  ) : (
                    <span className="text-muted">Unused</span>
                  )}
                </span>
                <span className="hidden sm:block text-xs text-muted">
                  Expires {formatDate(inv.expires_at)}
                </span>
                {inv.status === "active" && (
                  <button
                    onClick={() => onRevoke(inv.id)}
                    className="text-xs text-danger hover:bg-danger/10 px-2 py-1 rounded"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-3 sm:p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg sm:text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
