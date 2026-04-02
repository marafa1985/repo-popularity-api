import {
  validateSearchRepositoriesInput,
  type SearchRepositoriesInput,
} from "@/application/dto/SearchRepositoriesInput";
import type { SearchPopularRepositoriesResponse } from "@/application/dto/SearchPopularRepositoriesResponse";
import type { SearchRepositoriesResponse } from "@/application/dto/SearchRepositoriesResponse";
import type { Repository } from "@/application/domain/entities/Repository";
import { ILogger } from "../ports/ILogger";

type RepositorySearchClient = {
  searchRepositories(
    query: SearchRepositoriesInput,
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
    query: SearchRepositoriesInput,
  ): Promise<SearchPopularRepositoriesResponse> {
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

    const response: SearchPopularRepositoriesResponse = {
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
    query: SearchRepositoriesInput,
  ): SearchRepositoriesInput {
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

  private logSearchRepositoriesInfo(query: SearchRepositoriesInput): void {
    this.logger.info("Fetching repositories from search client", {
      clientId: "github",
      language: query.language,
      createdAfter: query.createdAfter,
      page: query.page,
      perPage: query.perPage,
    });
  }
}
