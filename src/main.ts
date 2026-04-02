import { InMemoryCacheService } from "./shared/cache/in-memory-cache.service";
import { WinstonLogger } from "./shared/logger/WinstonLogger";
import { env } from "./config/env";
import { createApp } from "./presentation/app";
import { GitHubClient } from "./application/services/repository-clients/github/github.client";
import { WeightedScoringStrategy } from "./application/services/score-strategy/weighted-scoring.strategy";
import { SearchPopularRepositoriesService } from "./application/services/search-popular-repositories.service";
import { SearchPopularRepositoriesResponseDto } from "./application/dto/search-popular-repositories-response.dto";

const logger = new WinstonLogger();
const cache = new InMemoryCacheService<SearchPopularRepositoriesResponseDto>();

const githubClient = new GitHubClient(logger, {
  baseURL: env.GITHUB_API_URL,
  timeoutMs: env.GITHUB_TIMEOUT_MS,
});

const weightedScoringStrategy = new WeightedScoringStrategy();

const searchPopularRepositoriesService = new SearchPopularRepositoriesService(
  githubClient,
  weightedScoringStrategy,
  logger,
  cache,
);

const app = createApp(searchPopularRepositoriesService, logger);

app.listen(env.PORT, () => {
  logger.info(
    `Server is running on port ${env.PORT}, open http://localhost:${env.PORT} to view it in the browser.`,
  );
  logger.info(
    `- Open http://localhost:${env.PORT}/api-docs for API documentation.`,
  );
});
