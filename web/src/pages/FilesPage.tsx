import { useEffect, useState, useCallback } from "react";
import type { MouseEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { listDir, deletePath, makeDir, type DirListing, type FileEntry } from "../api/files";
import { useAuth } from "../store/auth";
import { logout as logoutApi } from "../api/auth";
import { entryIcon, PlusIcon } from "../components/Icons";
import Breadcrumb from "../components/Breadcrumb";
import UploadZone from "../components/UploadZone";
import Viewer from "../components/Viewer";
import { formatBytes, formatDate } from "../lib/format";

export default function FilesPage() {
  const params = useParams();
  const nav = useNavigate();
  const path = params["*"] ?? "";
  const { user, refreshToken, clear } = useAuth();

  const [listing, setListing] = useState<DirListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setListing(await listDir(path)); }
    catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) setError("Folder not found");
      else if (status === 403) setError("Access denied");
      else setError("Couldn't load this folder");
    } finally { setLoading(false); }
  }, [path]);

  useEffect(() => { load(); }, [load]);

  async function onLogout() {
    if (refreshToken) { try { await logoutApi(refreshToken); } catch {} }
    clear();
    nav("/login");
  }

  const viewable = (listing?.entries ?? []).filter(
    (e) => !e.is_dir && (e.mime_type?.startsWith("image/") || e.mime_type?.startsWith("video/"))
  );

  function onEntryClick(e: FileEntry) {
    if (e.is_dir) { nav(`/files/${e.path}`); return; }
    const i = viewable.findIndex((v) => v.path === e.path);
    if (i >= 0) { setViewerIndex(i); return; }
    import("../api/files").then(({ getSignedUrl }) =>
      getSignedUrl(e.path).then((url) => {
        const a = document.createElement("a");
        a.href = url; a.download = e.name;
        document.body.appendChild(a); a.click(); a.remove();
      })
    );
  }

  async function onDelete(e: FileEntry, ev: MouseEvent) {
    ev.stopPropagation();
    const what = e.is_dir ? `folder "${e.name}"` : `"${e.name}"`;
    if (!confirm(`Delete ${what}? This can't be undone.`)) return;
    try { await deletePath(e.path); load(); }
    catch (err: any) {
      const s = err?.response?.status;
      alert(s === 409 ? "Folder not empty" : "Couldn't delete");
    }
  }

  async function onNewFolder() {
    const name = prompt("Folder name:");
    if (!name) return;
    if (/[\/\x00]/.test(name)) { alert("Invalid name"); return; }
    const newPath = path ? `${path}/${name}` : name;
    try { await makeDir(newPath); load(); }
    catch (err: any) {
      alert(err?.response?.status === 409 ? "Already exists" : "Couldn't create");
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-8 py-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link to="/" className="display text-2xl tracking-tightest hover:opacity-80 transition">
          sujitverse
        </Link>
        <div className="flex items-center gap-2">
          {user?.is_admin && (
            <Link to="/admin/invites"
                  className="badge text-folder border-folder/30 bg-folder/10 hover:bg-folder/15 transition">
              Admin
            </Link>
          )}
          <span className="text-sm text-muted hidden sm:inline">{user?.username}</span>
          <button onClick={onLogout} className="btn-ghost text-xs">Sign out</button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 mb-5">
        <Breadcrumb path={path} />
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onNewFolder} className="btn-ghost">
            <PlusIcon /> New folder
          </button>
        </div>
      </div>

      <div className="mb-6">
        <UploadZone parentPath={path} onUploaded={load} />
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {loading && <div className="px-6 py-16 text-center text-muted text-sm">Loading…</div>}

        {!loading && error && <div className="px-6 py-16 text-center text-danger text-sm">{error}</div>}

        {!loading && !error && listing && listing.entries.length === 0 && (
          <div className="px-6 py-20 text-center">
            <p className="text-subtle">This folder is empty.</p>
            <p className="text-faint text-sm mt-1">Drop files above to get started.</p>
          </div>
        )}

        {!loading && !error && listing && listing.entries.length > 0 && (
          <ul className="divide-y divide-border tabular">
            {listing.entries.map((entry) => {
              const { icon, color } = entryIcon(entry.mime_type, entry.is_dir, "w-5 h-5");
              return (
                <li key={entry.path} className="group">
                  <div className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-raised/40 transition">
                    <button onClick={() => onEntryClick(entry)}
                            className="flex-1 flex items-center gap-3 text-left min-w-0">
                      <span className={`shrink-0 ${color}`}>{icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-text">{entry.name}</span>
                        <span className="block text-xs text-muted sm:hidden mt-0.5">
                          {entry.is_dir ? "Folder" : formatBytes(entry.size_bytes)}
                          <span className="mx-1.5 text-faint">·</span>
                          {formatDate(entry.modified_at)}
                        </span>
                      </span>
                      <span className="hidden sm:block text-sm text-muted w-24 text-right">
                        {entry.is_dir ? "—" : formatBytes(entry.size_bytes)}
                      </span>
                      <span className="hidden sm:block text-sm text-muted w-32 text-right">
                        {formatDate(entry.modified_at)}
                      </span>
                    </button>
                    <button onClick={(ev) => onDelete(entry, ev)}
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                                       text-xs px-2 py-1 rounded-md text-danger hover:bg-danger/10 transition shrink-0">
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {viewerIndex !== null && (
        <Viewer entries={viewable} startIndex={viewerIndex}
                onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}
