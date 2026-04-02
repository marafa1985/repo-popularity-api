import type { SearchRepositoriesInput } from "@/application/dto/SearchRepositoriesInput";
import type { Request, Response } from "express";
import { SearchPopularRepositoriesService } from "@/application/services/SearchPopularRepositoriesService";

export class RepositoryController {
  constructor(
    private readonly searchPopularRepositoriesService: SearchPopularRepositoriesService,
  ) {}

  async search(
    request: Request<unknown, unknown, unknown, SearchRepositoriesInput>,
    response: Response,
  ): Promise<void> {
    const repositories = await this.searchPopularRepositoriesService.execute(
      request.query,
    );
    response.json(repositories);
  }
}
