import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_DIR: z.string().default("./logs"),
});

type AppEnv = z.infer<typeof envSchema>;

function loadEnv(processEnv: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(processEnv);
}

export const env: AppEnv = loadEnv();
