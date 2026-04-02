import express from "express";
import { createRepositoryRoutes } from "@/presentation/routes/repository.routes";
import { SearchPopularRepositoriesService } from "@/application/services/search-popular-repositories.service";
import { ILogger } from "@/application/ports/ILogger";
import { createRequestLogger } from "./middlewares/request-logger.middleware";
import { createErrorHandler } from "./middlewares/error-handler.middleware";

export function createApp(
  searchPopularRepositoriesService: SearchPopularRepositoriesService,
  logger: ILogger,
) {
  const app = express();

  app.use(express.json());
  app.use(createRequestLogger(logger));
  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });
  app.use(
    "/api/v1/repositories/",
    createRepositoryRoutes(searchPopularRepositoriesService),
  );

  app.use(createErrorHandler(logger));

  return app;
}
