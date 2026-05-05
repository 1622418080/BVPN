import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  AGENT_PORT: z.coerce.number().default(4100),
  AGENT_TOKEN: z.string().min(10),
  WG_INTERFACE: z.string().default("wg0"),
  WG_SERVER_PUBLIC_KEY: z.string().min(5),
  WG_SERVER_ENDPOINT: z.string().min(3),
  WG_DNS: z.string().default("1.1.1.1"),
  WG_ADDRESS_CIDR: z.string().default("10.8.0.0/24"),
  WG_DRY_RUN: z.coerce.boolean().default(true)
});

export const config = schema.parse(process.env);
