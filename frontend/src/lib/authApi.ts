import { api } from "./api";

export type SafeUser = { id: string; email: string; username: string };

export async function register(payload: {
  email: string;
  username: string;
  password: string;
}) {
  return api<{ user: SafeUser; accessToken: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { email: string; password: string }) {
  return api<{ user: SafeUser; accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refresh() {
  return api<{ accessToken: string }>("/auth/refresh", { method: "POST" });
}

export async function logout() {
  return api<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export async function me(accessToken: string) {
  return api<{ user: SafeUser }>("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}