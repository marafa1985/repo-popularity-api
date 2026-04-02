import type { SearchPopularRepositoriesResponseDto } from "../dto/search-popular-repositories-response.dto";
import type { SearchRepositoriesQueryDto } from "../dto/search-repositories-query.dto";
import { SearchRepositoriesResponseDto } from "../dto/scored-repository.dto";
import type { ICache } from "../ports/ICache";
import type { ILogger } from "../ports/ILogger";
import type { Repository } from "../domain/entities/repository";
import { ValidationError } from "../domain/errors/application.error";
import { SearchPopularRepositoriesService } from "./search-popular-repositories.service";

const buildCacheKey = (query: SearchRepositoriesQueryDto): string =>
  `popular-repos:${query.language}:${query.createdAfter}:${query.page}:${query.perPage}`;

class FakeRepositoryClient {
  constructor(
    private readonly response: SearchRepositoriesResponseDto = {
      totalCount: 0,
      items: [],
    },
  ) {}

  searchRepositories = jest.fn(async () => this.response);
}

describe("SearchPopularRepositoriesService", () => {
  const query: SearchRepositoriesQueryDto = {
    createdAfter: "2026-03-01",
    language: "TypeScript",
    page: 1,
    perPage: 10,
  };

  const createLogger = (): ILogger => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  });

  const createCache = (
    overrides: Partial<ICache<SearchPopularRepositoriesResponseDto>> = {},
  ): ICache<SearchPopularRepositoriesResponseDto> => ({
    has: jest.fn().mockReturnValue(false),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    ...overrides,
  });

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
    const logger = createLogger();
    const cache = createCache();
    const service = new SearchPopularRepositoriesService(
      repositoryClient,
      scoringService,
      logger,
      cache,
    );

    const response = await service.execute(query);

    expect(scoringService.score).toHaveBeenCalledTimes(2);
    expect(response.items).toEqual([
      expect.objectContaining({ name: "high", popularityScore: 90 }),
      expect.objectContaining({ name: "low", popularityScore: 10 }),
    ]);
    expect(response.pagination.totalCount).toBe(5_000);
    expect(response.pagination.returnedCount).toBe(2);
    expect(cache.set).toHaveBeenCalledWith(buildCacheKey(query), response);
  });

  it("returns cached repositories without calling downstream dependencies", async () => {
    const cachedResponse: SearchPopularRepositoriesResponseDto = {
      filters: {
        createdAfter: query.createdAfter,
        language: query.language,
      },
      pagination: {
        page: query.page,
        perPage: query.perPage,
        totalCount: 1,
        returnedCount: 1,
      },
      items: [
        {
          id: 1,
          name: "cached",
          fullName: "owner/cached",
          url: "https://github.com/owner/cached",
          description: null,
          language: "TypeScript",
          stars: 10,
          forks: 2,
          updatedAt: "2026-03-10T00:00:00Z",
          popularityScore: 77,
        },
      ],
    };
    const repositoryClient = new FakeRepositoryClient();
    const scoringService = { score: jest.fn() };
    const logger = createLogger();
    const cache = createCache({
      has: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue(cachedResponse),
    });
    const service = new SearchPopularRepositoriesService(
      repositoryClient,
      scoringService,
      logger,
      cache,
    );

    const response = await service.execute(query);

    expect(response).toBe(cachedResponse);
    expect(repositoryClient.searchRepositories).not.toHaveBeenCalled();
    expect(scoringService.score).not.toHaveBeenCalled();
  });

  it("rejects invalid pagination values before calling downstream dependencies", async () => {
    const repositoryClient = new FakeRepositoryClient();
    const scoringService = { score: jest.fn() };
    const logger = createLogger();
    const cache = createCache();
    const service = new SearchPopularRepositoriesService(
      repositoryClient,
      scoringService,
      logger,
      cache,
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
