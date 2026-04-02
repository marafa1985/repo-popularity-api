import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  CACHE_MAX_ENTRIES: z.coerce.number().min(1).default(5000),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_DIR: z.string().default("./logs"),
  GITHUB_API_URL: z.string().default("https://api.github.com"),
  GITHUB_TIMEOUT_MS: z.coerce.number().default(5000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),
});

export type AppEnv = z.infer<typeof envSchema>;

function loadEnv(processEnv: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(processEnv);
}

export const env: AppEnv = loadEnv();
