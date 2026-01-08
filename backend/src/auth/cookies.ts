import type { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const refreshCookieName = "refresh_token";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,            // true in prod (https)
  sameSite: isProd ? "none" : "lax",
  path: "/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};