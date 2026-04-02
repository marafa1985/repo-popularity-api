import { InMemoryCache } from "./shared/cache/InMemoryCache";
import { WinstonLogger } from "./shared/logger/WinstonLogger";
import { env } from "./config/env";
import { createApp } from "./presentation/app";
import { GitHubClient } from "./application/services/repository-clients/github/GitHubClient";
import { WeightedScoringStrategy } from "./application/services/score-strategy/WeightedScoringStrategy";
import { SearchPopularRepositoriesService } from "./application/services/SearchPopularRepositoriesService";

const logger = new WinstonLogger();
const cache = new InMemoryCache<string>();

const githubClient = new GitHubClient(logger, {
  baseURL: env.GITHUB_API_URL,
  timeoutMs: env.GITHUB_TIMEOUT_MS,
});

const weightedScoringStrategy = new WeightedScoringStrategy();

const searchPopularRepositoriesService = new SearchPopularRepositoriesService(
  githubClient,
  weightedScoringStrategy,
  logger,
);

const app = createApp(searchPopularRepositoriesService);

app.listen(env.PORT, () => {
  logger.info(
    `Server is running on port ${env.PORT}, open http://localhost:${env.PORT} to view it in the browser.`,
  );
});
