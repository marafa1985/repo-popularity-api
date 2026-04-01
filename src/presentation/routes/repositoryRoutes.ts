import { Router } from "express";
import { RepositoryController } from "@/presentation/controllers/RepositoryController";

export function createRepositoryRoutes(): Router {
  const router = Router();
  const controller = new RepositoryController();

  router.get("/popularity", controller.search);

  return router;
}
