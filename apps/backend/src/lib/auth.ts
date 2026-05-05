import jwt from "jsonwebtoken";
import { config } from "../config.js";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
}
