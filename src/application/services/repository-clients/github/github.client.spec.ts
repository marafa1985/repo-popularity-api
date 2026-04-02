import nock from "nock";

import type { ILogger } from "@/application/ports/ILogger";
import type { SearchRepositoriesQueryDto } from "@/application/dto/search-repositories-query.dto";
import { RateLimitError } from "@/application/domain/errors/application.error";

import { GitHubClient } from "./github.client";

const TEST_BASE_URL = "https://github-api.test";

describe("GitHubClient", () => {
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

  const createClient = (logger: ILogger) =>
    new GitHubClient(logger, { baseURL: TEST_BASE_URL });

  afterEach(() => {
    nock.cleanAll();
  });

  it("maps GitHub search items to domain repositories", async () => {
    const logger = createLogger();
    const client = createClient(logger);

    nock(TEST_BASE_URL)
      .get("/search/repositories")
      .query({
        q: "language:TypeScript created:>=2026-03-01",
        sort: "stars",
        order: "desc",
        page: "1",
        per_page: "10",
      })
      .reply(200, {
        total_count: 1,
        incomplete_results: false,
        items: [
          {
            id: 1,
            name: "repo-a",
            full_name: "owner/repo-a",
            html_url: "https://github.com/owner/repo-a",
            description: "Example repository",
            stargazers_count: 1200,
            forks_count: 80,
            language: "TypeScript",
            pushed_at: "2026-03-30T12:00:00Z",
          },
        ],
      });

    const response = await client.searchRepositories(query);

    expect(response.totalCount).toBe(1);
    expect(response.items).toEqual([
      expect.objectContaining({
        id: 1,
        name: "repo-a",
        fullName: "owner/repo-a",
        url: "https://github.com/owner/repo-a",
        description: "Example repository",
        stars: 1200,
        forks: 80,
        updatedAt: "2026-03-30T12:00:00Z",
        language: "TypeScript",
      }),
    ]);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("throws RateLimitError and logs when GitHub responds with 403", async () => {
    const logger = createLogger();
    const client = createClient(logger);

    nock(TEST_BASE_URL)
      .get("/search/repositories")
      .query(true)
      .reply(403, { message: "rate limit" });

    await expect(client.searchRepositories(query)).rejects.toMatchObject({
      name: "RateLimitError",
      message: "GitHub API rate limit reached.",
    });

    expect(logger.error).toHaveBeenCalledWith("GitHub API request failed", {
      statusCode: 403,
      message: expect.any(String),
    });
  });

  it("throws RateLimitError when GitHub responds with 429", async () => {
    const logger = createLogger();
    const client = createClient(logger);

    nock(TEST_BASE_URL).get("/search/repositories").query(true).reply(429);

    await expect(client.searchRepositories(query)).rejects.toThrow(
      RateLimitError,
    );
  });

  it("throws GitHubApiError when GitHub responds with 401", async () => {
    const logger = createLogger();
    const client = createClient(logger);

    nock(TEST_BASE_URL).get("/search/repositories").query(true).reply(401);

    await expect(client.searchRepositories(query)).rejects.toMatchObject({
      name: "GitHubApiError",
      message: "GitHub API authentication failed.",
    });
  });

  it("throws GitHubApiError for other HTTP errors", async () => {
    const logger = createLogger();
    const client = createClient(logger);

    nock(TEST_BASE_URL).get("/search/repositories").query(true).reply(502);

    await expect(client.searchRepositories(query)).rejects.toMatchObject({
      name: "GitHubApiError",
      message: "Failed to fetch repositories from GitHub.",
    });

    expect(logger.error).toHaveBeenCalledWith("GitHub API request failed", {
      statusCode: 502,
      message: expect.any(String),
    });
  });

  it("throws GitHubApiError when the request fails without a response", async () => {
    const logger = createLogger();
    const client = new GitHubClient(logger, {
      baseURL: TEST_BASE_URL,
      timeoutMs: 50,
    });

    nock(TEST_BASE_URL)
      .get("/search/repositories")
      .query(true)
      .delayBody(200)
      .reply(200, { total_count: 0, incomplete_results: false, items: [] });

    await expect(client.searchRepositories(query)).rejects.toMatchObject({
      name: "GitHubApiError",
      message: "Failed to fetch repositories from GitHub.",
    });

    expect(logger.error).toHaveBeenCalledWith("GitHub API request failed", {
      statusCode: undefined,
      message: expect.any(String),
    });
  });
});
