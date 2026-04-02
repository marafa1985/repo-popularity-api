import express from "express";
import swaggerUi from "swagger-ui-express";
import { createRepositoryRoutes } from "@/presentation/routes/repository.routes";
import { SearchPopularRepositoriesService } from "@/application/services/search-popular-repositories.service";
import { ILogger } from "@/application/ports/ILogger";
import {
  createRequestLogger,
  limiter,
  createErrorHandler,
} from "./middlewares";
import { openApiDocument } from "./openapi/open-api-document";

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
    limiter,
    createRepositoryRoutes(searchPopularRepositoriesService),
  );

  app.get("/openapi.json", (_request, response) => {
    response.status(200).json(openApiDocument);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(createErrorHandler(logger));

  return app;
}
