import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { createRepositoryRoutes } from "@/presentation/routes/repository.routes";
import { SearchPopularRepositoriesService } from "@/application/services/search-popular-repositories.service";
import { ILogger } from "@/application/ports/ILogger";
import {
  createRequestLogger,
  createRepositoryRateLimiter,
  createErrorHandler,
  createCorrelationId,
  type RateLimiterOptions,
} from "./middlewares";
import { openApiDocument } from "./openapi/open-api-document";

export function createApp(
  searchPopularRepositoriesService: SearchPopularRepositoriesService,
  logger: ILogger,
  rateLimiter?: RateLimiterOptions,
) {
  const app = express();
  app.use(cors());

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(express.json());
  app.use(createCorrelationId());
  app.use(createRequestLogger(logger));
  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  // Repository routes
  app.use(
    "/api/v1/repositories/",
    createRepositoryRateLimiter(
      rateLimiter?.windowMs,
      rateLimiter?.maxRequests,
      logger,
    ),
    createRepositoryRoutes(searchPopularRepositoriesService),
  );

  app.get("/openapi.json", (_request, response) => {
    response.status(200).json(openApiDocument);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(createErrorHandler(logger));

  return app;
}
