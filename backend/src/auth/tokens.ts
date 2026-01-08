import jwt from "jsonwebtoken";

type JwtUser = { sub: string; username: string };

const accessSecret = process.env.JWT_ACCESS_SECRET!;
const refreshSecret = process.env.JWT_REFRESH_SECRET!;
const accessExp = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const refreshExp = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export function signAccessToken(payload: JwtUser) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExp });
}

export function signRefreshToken(payload: JwtUser) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExp });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as JwtUser;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as JwtUser;
}