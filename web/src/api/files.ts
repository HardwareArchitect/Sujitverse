import { api } from "./client";

export type FileEntry = {
  name: string;
  path: string;
  is_dir: boolean;
  size_bytes: number;
  modified_at: number;
  mime_type: string | null;
};

export type DirListing = {
  path: string;
  entries: FileEntry[];
};

export async function listDir(relPath: string = ""): Promise<DirListing> {
  const url = relPath ? `/files/list/${encodeURI(relPath)}` : "/files/";
  const r = await api.get<DirListing>(url);
  return r.data;
}

export async function makeDir(relPath: string): Promise<void> {
  await api.post(`/files/mkdir`, null, { params: { rel_path: relPath } });
}

export async function deletePath(relPath: string): Promise<void> {
  await api.delete(`/files/${encodeURI(relPath)}`);
}

export async function getSignedUrl(relPath: string): Promise<string> {
  const r = await api.get<{ url: string; expires_in: number }>(
    `/files/sign/${encodeURI(relPath)}`
  );
  return r.data.url;
}

export type UploadProgress = { loaded: number; total: number };

export async function uploadFile(
  parentPath: string,
  file: File,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  const form = new FormData();
  form.append("upload_file", file);
  await api.post(`/files/upload`, form, {
    params: { rel_path: parentPath },
    signal,
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress({ loaded: e.loaded, total: e.total });
      }
    },
  });
}


export type Summary = {
  photo_count: number;
  video_count: number;
  file_count: number;
  total_size: number;
  recents: FileEntry[];
};

export async function getSummary(): Promise<Summary> {
  const r = await api.get<Summary>("/files/summary");
  return r.data;
}
