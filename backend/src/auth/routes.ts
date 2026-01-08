import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../db";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens";
import { refreshCookieName, refreshCookieOptions } from "./cookies";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

function toSafeUser(u: { id: string; email: string; username: string }) {
  return { id: u.id, email: u.email, username: u.username };
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, username, password } = parsed.data;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true },
  });
  if (exists) return res.status(409).json({ error: "Email or username already in use" });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, username, password: passwordHash },
    select: { id: true, email: true, username: true },
  });

  const payload = { sub: user.id, username: user.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);
  return res.status(201).json({ user: toSafeUser(user), accessToken });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true, password: true },
  });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const payload = { sub: user.id, username: user.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);
  return res.json({ user: toSafeUser(user), accessToken });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.[refreshCookieName];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await prisma.user.update({
        where: { id: payload.sub },
        data: { refreshTokenHash: null },
      });
    } catch {
      // ignore invalid token
    }
  }
  res.clearCookie(refreshCookieName, { ...refreshCookieOptions, maxAge: undefined });
  return res.json({ ok: true });
});

// Refresh: issues a new access token (and rotates refresh)
router.post("/refresh", async (req, res) => {
  const token = req.cookies?.[refreshCookieName];
  if (!token) return res.status(401).json({ error: "Missing refresh token" });

  let payload: { sub: string; username: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, email: true, refreshTokenHash: true },
  });
  if (!user?.refreshTokenHash) return res.status(401).json({ error: "Refresh revoked" });

  const matches = await bcrypt.compare(token, user.refreshTokenHash);
  if (!matches) return res.status(401).json({ error: "Refresh revoked" });

  // rotate refresh token
  const newPayload = { sub: user.id, username: user.username };
  const newAccess = signAccessToken(newPayload);
  const newRefresh = signRefreshToken(newPayload);

  const newHash = await bcrypt.hash(newRefresh, 12);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: newHash } });

  res.cookie(refreshCookieName, newRefresh, refreshCookieOptions);
  return res.json({ accessToken: newAccess });
});

// "me" requires an access token in Authorization header
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = auth.slice("Bearer ".length);

  // verify access token
  try {
    const jwt = (await import("./tokens")).then(m => m.verifyAccessToken);
    const verify = await jwt;
    const payload = verify(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true },
    });
    if (!user) return res.status(401).json({ error: "User not found" });
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;