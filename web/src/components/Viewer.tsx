import { useEffect, useState, useCallback } from "react";
import { getSignedUrl, type FileEntry } from "../api/files";

type Props = {
  entries: FileEntry[];
  startIndex: number;
  onClose: () => void;
};

export default function Viewer({ entries, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const current = entries[index];

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % entries.length);
  }, [entries.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + entries.length) % entries.length);
  }, [entries.length]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setUrl(null);
    getSignedUrl(current.path)
      .then((u) => { if (!cancelled) { setUrl(u); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [current.path]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  const isImage = current.mime_type?.startsWith("image/");
  const isVideo = current.mime_type?.startsWith("video/");

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
         onClick={onClose}>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl"
        aria-label="Close"
      >×</button>

      {entries.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
            aria-label="Previous"
          >‹</button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl"
            aria-label="Next"
          >›</button>
        </>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
        {current.name} {entries.length > 1 ? `(${index + 1}/${entries.length})` : ""}
      </div>

      <div className="max-w-[95vw] max-h-[90vh] flex items-center justify-center"
           onClick={(e) => e.stopPropagation()}>
        {loading && <div className="text-white/70">Loading…</div>}
        {!loading && url && isImage && (
          <img src={url} alt={current.name}
               className="max-w-full max-h-[90vh] object-contain" />
        )}
        {!loading && url && isVideo && (
          <video src={url} controls autoPlay
                 className="max-w-full max-h-[90vh]" />
        )}
        {!loading && url && !isImage && !isVideo && (
          <div className="text-white/70 text-center">
            <p className="mb-3">No preview available</p>
            <a href={url} download={current.name}
               className="inline-block px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
