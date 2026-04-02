import type { SearchRepositoriesQueryDto } from "@/application/dto/search-repositories-query.dto";
import type { Request, Response } from "express";
import { SearchPopularRepositoriesService } from "@/application/services/search-popular-repositories.service";

export class RepositoryController {
  constructor(
    private readonly searchPopularRepositoriesService: SearchPopularRepositoriesService,
  ) {}

  async search(
    request: Request<unknown, unknown, unknown, SearchRepositoriesQueryDto>,
    response: Response,
  ): Promise<void> {
    const repositories = await this.searchPopularRepositoriesService.execute(
      request.query,
    );
    response.json(repositories);
  }
}
