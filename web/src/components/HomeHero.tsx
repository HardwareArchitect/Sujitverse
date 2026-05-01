import { useEffect, useState } from "react";
import { getSummary, getSignedUrl, type Summary, type FileEntry } from "../api/files";
import { entryIcon, ImageIcon, VideoIcon, FileIcon } from "./Icons";
import { formatBytes } from "../lib/format";

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 5)  return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Up late";
}

function StatTile({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub?: string;
  color: string; icon: React.ReactNode;
}) {
  return (
    <div className="card p-4 sm:p-5 hover:border-border-strong transition group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-faint">{label}</span>
        <span className={`${color} opacity-80 group-hover:opacity-100 transition`}>{icon}</span>
      </div>
      <div className="text-2xl font-display tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

function RecentTile({ entry, onOpen }: { entry: FileEntry; onOpen: (e: FileEntry) => void }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const isImage = entry.mime_type?.startsWith("image/");
  const isVideo = entry.mime_type?.startsWith("video/");
  const { icon, color } = entryIcon(entry.mime_type, false, "w-6 h-6");

  useEffect(() => {
    if (isImage) {
      let cancelled = false;
      getSignedUrl(entry.path).then((u) => { if (!cancelled) setThumbUrl(u); }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, [entry.path, isImage]);

  return (
    <button onClick={() => onOpen(entry)}
            className="shrink-0 w-36 sm:w-44 card overflow-hidden text-left hover:shadow-raised
                       hover:-translate-y-0.5 hover:border-border-strong transition">
      <div className="relative w-full aspect-[4/3] bg-elevated flex items-center justify-center">
        {isImage && thumbUrl ? (
          <img src={thumbUrl} alt={entry.name}
               className="w-full h-full object-cover" />
        ) : (
          <div className={`${color} opacity-70`}>
            {isVideo ? <VideoIcon className="w-10 h-10" /> :
             isImage ? <ImageIcon className="w-10 h-10" /> :
             icon}
          </div>
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
              <span className="ml-0.5 border-l-[8px] border-l-white border-y-[6px] border-y-transparent" />
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm truncate">{entry.name}</div>
        <div className="text-xs text-faint mt-0.5">{formatBytes(entry.size_bytes)}</div>
      </div>
    </button>
  );
}

export default function HomeHero({
  username, onOpen,
}: {
  username: string;
  onOpen: (e: FileEntry) => void;
}) {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    getSummary().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="mb-8 animate-fade-in">
        <div className="h-8 w-64 rounded bg-elevated mb-6" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="h-24 rounded-2xl bg-elevated" />
          <div className="h-24 rounded-2xl bg-elevated" />
          <div className="h-24 rounded-2xl bg-elevated" />
        </div>
      </div>
    );
  }

  const empty = data.file_count === 0;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="display text-3xl tracking-tightest">
          {timeOfDay()}, <span className="text-folder">{username}</span>.
        </h1>
        <p className="text-muted text-sm mt-1">
          {empty
            ? "Your space is empty. Drop files anywhere below to begin."
            : `${data.file_count.toLocaleString()} ${data.file_count === 1 ? "file" : "files"} · ${formatBytes(data.total_size)} stored`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatTile label="Photos" value={data.photo_count.toLocaleString()}
                  color="text-photo"
                  icon={<ImageIcon className="w-4 h-4" />} />
        <StatTile label="Videos" value={data.video_count.toLocaleString()}
                  color="text-video"
                  icon={<VideoIcon className="w-4 h-4" />} />
        <StatTile label="Total" value={formatBytes(data.total_size)}
                  sub={`${data.file_count} files`}
                  color="text-folder"
                  icon={<FileIcon className="w-4 h-4" />} />
      </div>

      {data.recents.length > 0 && (
        <div className="mb-2">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-medium text-subtle">Recently added</h2>
            <span className="text-xs text-faint">{data.recents.length} items</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-0 sm:px-0
                          [scrollbar-width:thin]">
            {data.recents.map((r) => (
              <RecentTile key={r.path} entry={r} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
