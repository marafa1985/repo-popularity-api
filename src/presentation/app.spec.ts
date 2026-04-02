import request from "supertest";
import nock from "nock";

import {
  ValidationError,
  RateLimitError,
} from "@/application/domain/errors/application.error";
import { createApp } from "@/presentation/app";
import type { ILogger } from "@/application/ports/ILogger";
import type { SearchPopularRepositoriesResponseDto } from "@/application/dto/search-popular-repositories-response.dto";
import { SearchPopularRepositoriesService } from "@/application/services/search-popular-repositories.service";
import { GitHubClient } from "@/application/services/repository-clients/github/github.client";
import { WeightedScoringStrategy } from "@/application/services/score-strategy/weighted-scoring.strategy";
import { InMemoryCacheService } from "@/shared/cache/in-memory-cache.service";

describe("createApp", () => {
  const createLogger = (): ILogger => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  });

  const createService = () =>
    ({
      execute: jest.fn(),
    }) as unknown as SearchPopularRepositoriesService;

  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  it("exposes a liveness health endpoint", async () => {
    const app = createApp(createService(), createLogger());
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("validates query parameters inside the real service before calling GitHub", async () => {
    const logger = createLogger();
    const base = "https://github-validation.test";
    const githubClient = new GitHubClient(logger, { baseURL: base });
    const search = jest.spyOn(githubClient, "searchRepositories");
    const service = new SearchPopularRepositoriesService(
      githubClient,
      new WeightedScoringStrategy(),
      logger,
      new InMemoryCacheService<SearchPopularRepositoriesResponseDto>(),
    );
    const app = createApp(service, logger);

    const response = await request(app)
      .get("/api/v1/repositories/popularity")
      .query({
        createdAfter: "2026-03-01",
        language: "TypeScript",
        page: "1",
        perPage: "500",
      });

    expect(response.status).toBe(400);
    expect(search).not.toHaveBeenCalled();
  });

  it("propagates x-request-id when provided", async () => {
    const service = createService();
    jest.spyOn(service, "execute").mockResolvedValue({
      filters: { createdAfter: "2026-03-01", language: "TypeScript" },
      pagination: {
        page: 1,
        perPage: 10,
        totalCount: 0,
        returnedCount: 0,
      },
      incompleteResults: false,
      items: [],
    });
    const logger = createLogger();
    const app = createApp(service, logger);
    const id = "client-correlation-id-99";
    const response = await request(app)
      .get("/api/v1/repositories/popularity")
      .set("X-Request-Id", id)
      .query({
        createdAfter: "2026-03-01",
        language: "TypeScript",
        page: "1",
        perPage: "10",
      });
    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe(id);
    expect(logger.info).toHaveBeenCalledWith(
      "HTTP request completed",
      expect.objectContaining({ requestId: id }),
    );
  });

  it("returns repositories from the search service", async () => {
    const responsePayload: SearchPopularRepositoriesResponseDto = {
      filters: {
        createdAfter: "2026-03-01",
        language: "TypeScript",
      },
      pagination: {
        page: 1,
        perPage: 10,
        totalCount: 1,
        returnedCount: 1,
      },
      incompleteResults: false,
      items: [
        {
          id: 1,
          name: "score-github",
          fullName: "mahmoud/score-github",
          url: "https://github.com/mahmoud/score-github",
          description: "A GitHub repository scorer",
          language: "TypeScript",
          stars: 100,
          forks: 20,
          updatedAt: "2026-03-31T00:00:00.000Z",
          popularityScore: 88.4,
        },
      ],
    };
    const service = createService();
    const execute = jest
      .spyOn(service, "execute")
      .mockResolvedValue(responsePayload);
    const app = createApp(service, createLogger());

    const response = await request(app)
      .get("/api/v1/repositories/popularity")
      .query({
        createdAfter: "2026-03-01",
        language: "TypeScript",
        page: "1",
        perPage: "10",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(responsePayload);
    expect(execute).toHaveBeenCalledWith({
      createdAfter: "2026-03-01",
      language: "TypeScript",
      page: "1",
      perPage: "10",
    });
  });

  it("returns a 400 response for validation errors", async () => {
    const service = createService();
    jest
      .spyOn(service, "execute")
      .mockRejectedValue(
        new ValidationError('Query parameter "language" is required.'),
      );
    const app = createApp(service, createLogger());

    const response = await request(app)
      .get("/api/v1/repositories/popularity")
      .query({
        createdAfter: "2026-03-01",
        language: "",
        page: "1",
        perPage: "10",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "ValidationError",
      message: 'Query parameter "language" is required.',
    });
  });

  it("returns a 429 response for rate limit errors", async () => {
    const service = createService();
    jest
      .spyOn(service, "execute")
      .mockRejectedValue(new RateLimitError("GitHub API rate limit reached."));
    const app = createApp(service, createLogger());

    const response = await request(app)
      .get("/api/v1/repositories/popularity")
      .query({
        createdAfter: "2026-03-01",
        language: "TypeScript",
        page: "1",
        perPage: "10",
      });

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      error: "RateLimitError",
      message: "GitHub API rate limit reached.",
    });
  });

  it("returns a 500 response and logs unexpected errors", async () => {
    const logger = createLogger();
    const service = createService();
    const error = new Error("Unexpected failure");
    jest.spyOn(service, "execute").mockRejectedValue(error);
    const app = createApp(service, logger);

    const response = await request(app)
      .get("/api/v1/repositories/popularity")
      .query({
        createdAfter: "2026-03-01",
        language: "TypeScript",
        page: "1",
        perPage: "10",
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "InternalServerError",
      message: "An unexpected error occurred.",
    });
    expect(logger.error).toHaveBeenCalledWith("Unhandled application error", {
      requestId: expect.any(String),
      message: "Unexpected failure",
      stack: error.stack,
    });
  });

  it("enforces request rate limits on repository routes", async () => {
    const logger = createLogger();
    const service = createService();
    jest.spyOn(service, "execute").mockResolvedValue({
      filters: {
        createdAfter: "2026-03-01",
        language: "TypeScript",
      },
      pagination: {
        page: 1,
        perPage: 10,
        totalCount: 1,
        returnedCount: 0,
      },
      incompleteResults: false,
      items: [],
    });
    const app = createApp(service, logger, {
      windowMs: 60_000,
      maxRequests: 2,
    });

    const query = {
      createdAfter: "2026-03-01",
      language: "TypeScript",
      page: "1",
      perPage: "10",
    };

    const firstResponse = await request(app)
      .get("/api/v1/repositories/popularity")
      .query(query);
    const secondResponse = await request(app)
      .get("/api/v1/repositories/popularity")
      .query(query);
    const thirdResponse = await request(app)
      .get("/api/v1/repositories/popularity")
      .query(query);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(thirdResponse.status).toBe(429);
    expect(thirdResponse.body).toEqual({
      error: "RateLimitError",
      message: "Too many requests. Please try again later.",
    });
    expect(thirdResponse.headers["retry-after"]).toBe("60");
    expect(service.execute).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith("Request rate limit exceeded", {
      requestId: expect.any(String),
      path: "/popularity",
      method: "GET",
      clientIp: expect.any(String),
      maxRequests: 2,
      windowMs: 60_000,
    });
  });
});
