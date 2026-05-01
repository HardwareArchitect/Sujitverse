import { useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { uploadFile } from "../api/files";
import { formatBytes } from "../lib/format";

type Item = {
  id: string;
  file: File;
  loaded: number;
  total: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

type Props = { parentPath: string; onUploaded: () => void };

export default function UploadZone({ parentPath, onUploaded }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const newItems: Item[] = arr.map((f) => ({
      id: `${Date.now()}-${Math.random()}-${f.name}`,
      file: f, loaded: 0, total: f.size, status: "queued",
    }));
    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((it) => start(it));
  }

  async function start(item: Item) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "uploading" } : i));
    try {
      await uploadFile(parentPath, item.file, (p) => {
        setItems((prev) => prev.map((i) =>
          i.id === item.id ? { ...i, loaded: p.loaded, total: p.total } : i
        ));
      });
      setItems((prev) => prev.map((i) =>
        i.id === item.id ? { ...i, status: "done", loaded: i.total } : i
      ));
      onUploaded();
    } catch (e: any) {
      const msg = e?.response?.status === 409 ? "Already exists" : "Upload failed";
      setItems((prev) => prev.map((i) =>
        i.id === item.id ? { ...i, status: "error", error: msg } : i
      ));
    }
  }

  function clearDone() {
    setItems((prev) => prev.filter((i) => i.status !== "done"));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl px-4 py-8 text-center cursor-pointer transition
                   ${dragOver ? "border-accent bg-accent/5" : "border-border hover:border-muted"}`}
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-sm text-muted">
          Drop files here, or <span className="text-accent">browse</span>
        </p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick} />
      </div>

      {items.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-3 space-y-2">
          {items.map((it) => {
            const pct = it.total > 0 ? Math.round((it.loaded / it.total) * 100) : 0;
            return (
              <div key={it.id} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className="truncate flex-1">{it.file.name}</span>
                  <span className="text-muted shrink-0">
                    {it.status === "done" ? "Done" :
                     it.status === "error" ? <span className="text-danger">{it.error}</span> :
                     `${formatBytes(it.loaded)} / ${formatBytes(it.total)}`}
                  </span>
                </div>
                <div className="h-1 bg-bg rounded mt-1 overflow-hidden">
                  <div className={`h-full transition-all ${it.status === "error" ? "bg-danger" : "bg-accent"}`}
                       style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {items.some((i) => i.status === "done") && (
            <button onClick={clearDone} className="text-xs text-muted hover:text-text">
              Clear completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
