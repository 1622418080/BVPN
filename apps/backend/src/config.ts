import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: "/app/.env" });

const schema = z.object({
  BACKEND_PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(20),
  AGENT_URL: z.string().url().default("http://localhost:4100"),
  AGENT_TOKEN: z.string().min(10),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  CRYPTO_PROVIDER: z.string().optional().default("nowpayments"),
  CRYPTO_API_KEY: z.string().optional().default(""),
  CRYPTO_IPN_SECRET: z.string().optional().default(""),
  ENABLE_DEV_PAYMENTS: z.coerce.boolean().default(false),
  AGENT_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000)
});

export const config = schema.parse(process.env);
