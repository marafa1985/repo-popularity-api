import { env } from "./env";

describe("loadEnv", () => {
  it("applies defaults values of env variables", () => {
    expect(env).toMatchObject({
      PORT: 3000,
      CACHE_TTL_SECONDS: 300,
      LOG_LEVEL: "info",
      LOG_DIR: "./logs",
      GITHUB_API_URL: "https://api.github.com",
      GITHUB_TIMEOUT_MS: 5000,
      REPOSITORY_ROUTE_WINDOW_MS: 60000,
      REPOSITORY_ROUTE_MAX_REQUESTS: 10,
    });
  });
});
