import { api } from "./client";

export type Invite = {
  id: number;
  code: string | null;       // only set on creation response
  created_at: number;
  expires_at: number;
  used_at: number | null;
  used_by_username: string | null;
  revoked: boolean;
  status: "active" | "used" | "expired" | "revoked";
};

export type Stats = {
  user_count: number;
  max_users: number;
  remaining_slots: number;
};

export async function getStats(): Promise<Stats> {
  const r = await api.get<Stats>("/admin/stats");
  return r.data;
}

export async function listInvites(): Promise<Invite[]> {
  const r = await api.get<Invite[]>("/admin/invites");
  return r.data;
}

export async function createInvite(expires_in_days = 7): Promise<Invite> {
  const r = await api.post<Invite>("/admin/invites", { expires_in_days });
  return r.data;
}

export async function revokeInvite(id: number): Promise<void> {
  await api.delete(`/admin/invites/${id}`);
}
