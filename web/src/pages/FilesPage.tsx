import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { listDir, type DirListing, type FileEntry } from "../api/files";
import { useAuth } from "../store/auth";
import { logout as logoutApi } from "../api/auth";
import { entryIcon } from "../components/Icons";
import Breadcrumb from "../components/Breadcrumb";
import { formatBytes, formatDate } from "../lib/format";

export default function FilesPage() {
  const params = useParams();
  const nav = useNavigate();
  const path = params["*"] ?? "";
  const { user, refreshToken, clear } = useAuth();

  const [listing, setListing] = useState<DirListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDir(path);
      setListing(data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) setError("Folder not found");
      else if (status === 403) setError("Access denied");
      else setError("Couldn't load this folder");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);

  async function onLogout() {
    if (refreshToken) { try { await logoutApi(refreshToken); } catch {} }
    clear();
    nav("/login");
  }

  function onEntryClick(e: FileEntry) {
    if (e.is_dir) {
      nav(`/files/${e.path}`);
    } else {
      // File preview/download in stage 4.4c. For now no-op.
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <Link to="/" className="text-xl font-semibold">sujitverse</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted hidden sm:inline">
            {user?.username}{user?.is_admin ? " (admin)" : ""}
          </span>
          <button
            onClick={onLogout}
            className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mb-4">
        <Breadcrumb path={path} />
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {loading && (
          <div className="px-6 py-12 text-center text-muted">Loading…</div>
        )}

        {!loading && error && (
          <div className="px-6 py-12 text-center text-danger">{error}</div>
        )}

        {!loading && !error && listing && listing.entries.length === 0 && (
          <div className="px-6 py-16 text-center text-muted">
            <p className="mb-1">This folder is empty.</p>
            <p className="text-xs">Upload coming soon.</p>
          </div>
        )}

        {!loading && !error && listing && listing.entries.length > 0 && (
          <ul className="divide-y divide-border">
            {listing.entries.map((entry) => (
              <li key={entry.path}>
                <button
                  onClick={() => onEntryClick(entry)}
                  className="w-full flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-bg/40 transition text-left"
                >
                  <span className="shrink-0 text-muted">
                    {entryIcon(entry.mime_type, entry.is_dir, "w-5 h-5")}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{entry.name}</span>
                    <span className="block text-xs text-muted sm:hidden">
                      {entry.is_dir ? "Folder" : formatBytes(entry.size_bytes)}
                      {" · "}{formatDate(entry.modified_at)}
                    </span>
                  </span>
                  <span className="hidden sm:block text-sm text-muted w-24 text-right">
                    {entry.is_dir ? "—" : formatBytes(entry.size_bytes)}
                  </span>
                  <span className="hidden sm:block text-sm text-muted w-32 text-right">
                    {formatDate(entry.modified_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
