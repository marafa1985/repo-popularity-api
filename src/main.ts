import { InMemoryCache } from "./shared/cache/InMemoryCache";
import { WinstonLogger } from "./shared/logger/WinstonLogger";
import { env } from "./config/env";
import { createApp } from "./presentation/app";

const logger = new WinstonLogger();
const cache = new InMemoryCache<string>();

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    `Server is running on port ${env.PORT}, open http://localhost:${env.PORT} to view it in the browser.`,
  );
});
