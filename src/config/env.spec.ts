import { env } from "./env";

describe("loadEnv", () => {
  it("applies defaults values of env variables", () => {
    expect(env).toMatchObject({
      PORT: 3000,
      CACHE_TTL_SECONDS: 300,
      CACHE_MAX_ENTRIES: 5000,
      LOG_LEVEL: "info",
      LOG_DIR: "./logs",
      GITHUB_API_URL: "https://api.github.com",
      GITHUB_TIMEOUT_MS: 5000,
      RATE_LIMIT_WINDOW_MS: 60000,
      RATE_LIMIT_MAX_REQUESTS: 10,
    });
  });
});
