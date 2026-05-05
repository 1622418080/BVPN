import "dotenv/config";
import { z } from "zod";

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
  ENABLE_DEV_PAYMENTS: z.coerce.boolean().default(false)
});

export const config = schema.parse(process.env);
