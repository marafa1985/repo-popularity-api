import type { SearchRepositoriesInput } from "../dto/SearchRepositoriesInput";
import type { SearchRepositoriesResponse } from "../dto/SearchRepositoriesResponse";
import type { Repository } from "../domain/entities/Repository";
import { ValidationError } from "../domain/errors/ApplicationError";
import { SearchPopularRepositoriesService } from "./SearchPopularRepositoriesService";

class FakeRepositoryClient {
  constructor(
    private readonly response: SearchRepositoriesResponse = {
      totalCount: 0,
      items: [],
    },
  ) {}

  searchRepositories = jest.fn(async () => this.response);
}

describe("SearchPopularRepositoriesService", () => {
  const query: SearchRepositoriesInput = {
    createdAfter: "2026-03-01",
    language: "TypeScript",
    page: 1,
    perPage: 10,
  };

  it("scores repositories and returns them ordered by popularity score", async () => {
    const repositories: Repository[] = [
      {
        id: 1,
        name: "low",
        fullName: "owner/low",
        url: "https://github.com/owner/low",
        description: null,
        language: "TypeScript",
        stars: 10,
        forks: 1,
        updatedAt: "2026-03-01T00:00:00Z",
      },
      {
        id: 2,
        name: "high",
        fullName: "owner/high",
        url: "https://github.com/owner/high",
        description: null,
        language: "TypeScript",
        stars: 1_000,
        forks: 100,
        updatedAt: "2026-03-20T00:00:00Z",
      },
    ];
    const repositoryClient = new FakeRepositoryClient({
      totalCount: 5_000,
      items: repositories,
    });
    const scoringService = {
      score: jest
        .fn()
        .mockImplementation((repository: Repository) =>
          repository.name === "high" ? 90 : 10,
        ),
    };
    const service = new SearchPopularRepositoriesService(
      repositoryClient,
      scoringService,
    );

    const response = await service.execute(query);

    expect(scoringService.score).toHaveBeenCalledTimes(2);
    expect(response.items).toEqual([
      expect.objectContaining({ name: "high", popularityScore: 90 }),
      expect.objectContaining({ name: "low", popularityScore: 10 }),
    ]);
    expect(response.pagination.totalCount).toBe(5_000);
    expect(response.pagination.returnedCount).toBe(2);
  });

  it("rejects invalid pagination values before calling downstream dependencies", async () => {
    const repositoryClient = new FakeRepositoryClient();
    const scoringService = { score: jest.fn() };
    const service = new SearchPopularRepositoriesService(
      repositoryClient,
      scoringService,
    );

    await expect(
      service.execute({
        createdAfter: "2026-03-01",
        language: "TypeScript",
        page: 0,
        perPage: 10,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(repositoryClient.searchRepositories).not.toHaveBeenCalled();
    expect(scoringService.score).not.toHaveBeenCalled();
  });
});
