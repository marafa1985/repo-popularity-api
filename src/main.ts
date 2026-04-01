import express from "express";
import { InMemoryCache } from "./shared/cache/InMemoryCache";
import { WinstonLogger } from "./shared/logger/WinstonLogger";

const logger = new WinstonLogger();
const cache = new InMemoryCache<string>();

const app = express();

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

cache.set("test", "test Value");
logger.info(cache.get("test") ?? "No value found");

app.listen(3000, () => {
  logger.info(
    "Server is running on port 3000, open http://localhost:3000 to view it in the browser.",
  );
});
