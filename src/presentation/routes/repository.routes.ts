import { Router } from "express";
import { RepositoryController } from "@/presentation/controllers/repository.controller";
import { SearchPopularRepositoriesService } from "@/application/services/search-popular-repositories.service";

export function createRepositoryRoutes(
  searchPopularRepositoriesService: SearchPopularRepositoriesService,
): Router {
  const router = Router();
  const controller = new RepositoryController(searchPopularRepositoriesService);

  router.get("/popularity", controller.search.bind(controller));

  return router;
}
