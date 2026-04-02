import { Router } from "express";
import { RepositoryController } from "@/presentation/controllers/RepositoryController";
import { SearchPopularRepositoriesService } from "@/application/services/SearchPopularRepositoriesService";

export function createRepositoryRoutes(
  searchPopularRepositoriesService: SearchPopularRepositoriesService,
): Router {
  const router = Router();
  const controller = new RepositoryController(searchPopularRepositoriesService);

  router.get("/popularity", controller.search.bind(controller));

  return router;
}
