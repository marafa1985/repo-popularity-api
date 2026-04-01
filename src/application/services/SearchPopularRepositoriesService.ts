import {
  type SearchRepositoriesInput,
  searchRepositoriesInputSchema,
} from "@/application/dto/SearchRepositoriesInput";
import type { SearchPopularRepositoriesResponse } from "@/application/dto/SearchPopularRepositoriesResponse";
import type { SearchRepositoriesResponse } from "@/application/dto/SearchRepositoriesResponse";
import type { Repository } from "@/application/domain/entities/Repository";
import { ValidationError } from "@/application/domain/errors/ApplicationError";

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
  ) {}

  async execute(
    query: SearchRepositoriesInput,
  ): Promise<SearchPopularRepositoriesResponse> {
    const parsed = searchRepositoriesInputSchema.safeParse(query);
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ");
      throw new ValidationError(message);
    }
    const validated = parsed.data;

    const repositories =
      await this.repositoryClient.searchRepositories(validated);

    const scoredRepositories = repositories.items
      .map((repository) => ({
        ...repository,
        popularityScore: this.scoringService.score(repository),
      }))
      .sort((left, right) => right.popularityScore - left.popularityScore);

    const response: SearchPopularRepositoriesResponse = {
      filters: {
        createdAfter: validated.createdAfter,
        language: validated.language,
      },
      pagination: {
        page: validated.page,
        perPage: validated.perPage,
        totalCount: repositories.totalCount,
        returnedCount: scoredRepositories.length,
      },
      items: scoredRepositories,
    };

    return response;
  }
}
