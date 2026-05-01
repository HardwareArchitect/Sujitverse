type IconProps = { className?: string };

const base = "stroke-[1.5]";

export const FolderIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <path d="M3 7.5a2 2 0 0 1 2-2h3.5l1.8 1.8a1 1 0 0 0 .7.3H19a2 2 0 0 1 2 2v7.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z" />
  </svg>
);

export const FileIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
  </svg>
);

export const ImageIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <circle cx="9" cy="9" r="1.6" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

export const VideoIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <rect x="3" y="5.5" width="14" height="13" rx="2.5" />
    <path d="m21 8-4 4 4 4V8Z" />
  </svg>
);

export const AudioIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <path d="M9 18V6l11-2v12" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </svg>
);

export const DocIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

export const ArchiveIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <path d="M3 6h18v4H3z" />
    <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    <path d="M10 14h4" />
  </svg>
);

export const ChevronRight = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const HomeIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export const PlusIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`stroke-2 ${className}`}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const UploadIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m17 8-5-5-5 5" />
    <path d="M12 3v12" />
  </svg>
);

export const CheckIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeLinecap="round" strokeLinejoin="round" className={`stroke-2 ${className}`}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/** Returns icon + accent color class based on file mime/type. */
export function entryIcon(mime: string | null, isDir: boolean, size = "w-5 h-5") {
  if (isDir) return { icon: <FolderIcon className={size} />, color: "text-folder" };
  const m = mime ?? "";
  if (m.startsWith("image/")) return { icon: <ImageIcon className={size} />, color: "text-photo" };
  if (m.startsWith("video/")) return { icon: <VideoIcon className={size} />, color: "text-video" };
  if (m.startsWith("audio/")) return { icon: <AudioIcon className={size} />, color: "text-audio" };
  if (m.includes("pdf") || m.startsWith("text/") || m.includes("word") || m.includes("document"))
    return { icon: <DocIcon className={size} />, color: "text-doc" };
  if (m.includes("zip") || m.includes("tar") || m.includes("archive") || m.includes("compress"))
    return { icon: <ArchiveIcon className={size} />, color: "text-archive" };
  return { icon: <FileIcon className={size} />, color: "text-muted" };
}
