import { env } from "./env";

describe("loadEnv", () => {
  it("applies defaults values of env variables", () => {
    expect(env).toMatchObject({
      PORT: 3000,
      CACHE_TTL_SECONDS: 300,
      LOG_LEVEL: "info",
      LOG_DIR: "./logs",
    });
  });
});
