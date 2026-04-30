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
