import { api } from "./client";
import type { User } from "../store/auth";

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export async function login(username: string, password: string): Promise<LoginResponse> {
  const r = await api.post<LoginResponse>("/auth/login", { username, password });
  return r.data;
}

export async function logout(refresh_token: string): Promise<void> {
  await api.post("/auth/logout", { refresh_token });
}

export async function me(): Promise<User> {
  const r = await api.get<User>("/auth/me");
  return r.data;
}
