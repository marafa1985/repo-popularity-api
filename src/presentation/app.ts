import express from "express";
import { createRepositoryRoutes } from "@/presentation/routes/repositoryRoutes";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });
  app.use("/api/v1/repositories/", createRepositoryRoutes());

  return app;
}
