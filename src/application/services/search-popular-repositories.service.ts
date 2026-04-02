import {
  validateSearchRepositoriesInput,
  type SearchRepositoriesQueryDto,
} from "@/application/dto/search-repositories-query.dto";
import type { SearchPopularRepositoriesResponseDto } from "@/application/dto/search-popular-repositories-response.dto";
import type { SearchRepositoriesResponseDto } from "@/application/dto/scored-repository.dto";
import type { Repository } from "@/application/domain/entities/repository";
import type { ILogger } from "@/application/ports/ILogger";
import type { ICache } from "@/application/ports/ICache";

type RepositorySearchClient = {
  searchRepositories(
    query: SearchRepositoriesQueryDto,
  ): Promise<SearchRepositoriesResponseDto>;
};

type RepositoryScorer = {
  score(repository: Repository): number;
};

export class SearchPopularRepositoriesService {
  constructor(
    private readonly repositoryClient: RepositorySearchClient,
    private readonly scoringService: RepositoryScorer,
    private readonly logger: ILogger,
    private readonly cache: ICache<SearchPopularRepositoriesResponseDto>,
  ) {}

  async execute(
    query: SearchRepositoriesQueryDto,
  ): Promise<SearchPopularRepositoriesResponseDto> {
    const parsedQuery = this.validateQuery(query);
    const cacheKey = this.buildCacheKey(parsedQuery);

    if (this.cache.has(cacheKey)) {
      this.logger.info("Returning cached repositories", { cacheKey });
      return this.cache.get(cacheKey) as SearchPopularRepositoriesResponseDto;
    }

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
      incompleteResults: repositories.incompleteResults,
    };

    this.cache.set(cacheKey, response);
    this.logger.debug("Cached scored repositories", {
      cacheKey,
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

  private buildCacheKey(query: SearchRepositoriesQueryDto): string {
    return `popular-repos:${query.language}:${query.createdAfter}:${query.page}:${query.perPage}`;
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
