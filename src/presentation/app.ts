import express from "express";
import { createRepositoryRoutes } from "@/presentation/routes/repository.routes";
import { SearchPopularRepositoriesService } from "@/application/services/search-popular-repositories.service";

export function createApp(
  searchPopularRepositoriesService: SearchPopularRepositoriesService,
) {
  const app = express();

  app.use(express.json());
  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });
  app.use(
    "/api/v1/repositories/",
    createRepositoryRoutes(searchPopularRepositoriesService),
  );

  return app;
}
