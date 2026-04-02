import {
  validateSearchRepositoriesInput,
  type SearchRepositoriesQueryDto,
} from "@/application/dto/search-repositories-query.dto";
import type { SearchPopularRepositoriesResponseDto } from "@/application/dto/search-popular-repositories-response.dto";
import type { SearchRepositoriesResponse } from "@/application/dto/scored-repository.dto";
import type { Repository } from "@/application/domain/entities/repository";
import { ILogger } from "../ports/ILogger";

type RepositorySearchClient = {
  searchRepositories(
    query: SearchRepositoriesQueryDto,
  ): Promise<SearchRepositoriesResponse>;
};

type RepositoryScorer = {
  score(repository: Repository): number;
};

export class SearchPopularRepositoriesService {
  constructor(
    private readonly repositoryClient: RepositorySearchClient,
    private readonly scoringService: RepositoryScorer,
    private readonly logger: ILogger,
  ) {}

  async execute(
    query: SearchRepositoriesQueryDto,
  ): Promise<SearchPopularRepositoriesResponseDto> {
    const parsedQuery = this.validateQuery(query);

    this.logSearchRepositoriesInfo(parsedQuery);

    const repositories =
      await this.repositoryClient.searchRepositories(parsedQuery);

    const scoredRepositories = repositories.items
      .map((repository) => ({
        ...repository,
        popularityScore: this.scoringService.score(repository),
      }))
      .sort((left, right) => right.popularityScore - left.popularityScore);

    const response: SearchPopularRepositoriesResponseDto = {
      filters: {
        createdAfter: parsedQuery.createdAfter,
        language: parsedQuery.language,
      },
      pagination: {
        page: parsedQuery.page,
        perPage: parsedQuery.perPage,
        totalCount: repositories.totalCount,
        returnedCount: scoredRepositories.length,
      },
      items: scoredRepositories,
    };

    this.logger.debug("Cached scored repositories", {
      count: scoredRepositories.length,
    });

    return response;
  }

  private validateQuery(
    query: SearchRepositoriesQueryDto,
  ): SearchRepositoriesQueryDto {
    try {
      return validateSearchRepositoriesInput(query);
    } catch (error) {
      this.logger.error("Invalid search repositories query", {
        query,
        message:
          error instanceof Error ? error.message : "Unknown validation error",
      });

      throw error;
    }
  }

  private logSearchRepositoriesInfo(query: SearchRepositoriesQueryDto): void {
    this.logger.info("Fetching repositories from search client", {
      clientId: "github",
      language: query.language,
      createdAfter: query.createdAfter,
      page: query.page,
      perPage: query.perPage,
    });
  }
}
