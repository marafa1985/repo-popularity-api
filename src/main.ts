import express from "express";
import { InMemoryCache } from "./shared/cache/InMemoryCache";
import { WinstonLogger } from "./shared/logger/WinstonLogger";
import { env } from "./config/env";

const logger = new WinstonLogger();
const cache = new InMemoryCache<string>();

const app = express();

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

cache.set("test", "test Value");
logger.info(cache.get("test") ?? "No value found");

app.listen(env.PORT, () => {
  logger.info(
    `Server is running on port ${env.PORT}, open http://localhost:${env.PORT} to view it in the browser.`,
  );
});
