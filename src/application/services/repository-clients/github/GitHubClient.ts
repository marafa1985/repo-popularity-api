import type { SearchRepositoriesInput } from "@/application/dto/SearchRepositoriesInput";
import axios from "axios";

import type { ILogger } from "@/application/ports/ILogger";
import type { SearchRepositoriesResponse } from "@/application/dto/SearchRepositoriesResponse";
import type { Repository } from "@/application/domain/entities/Repository";
import {
  GitHubApiError,
  RateLimitError,
} from "@/application/domain/errors/ApplicationError";
import type {
  GitHubRepositoryDTO,
  GitHubSearchResponseDTO,
} from "./dto/GitHubRepositoryDTO";
import { env } from "@/config/env";

export type GitHubClientHttpOptions = {
  baseURL?: string;
  timeoutMs?: number;
};

export class GitHubClient {
  private readonly httpClient: ReturnType<typeof axios.create>;

  constructor(
    private readonly logger: ILogger,
    httpOptions?: GitHubClientHttpOptions,
  ) {
    this.httpClient = axios.create({
      baseURL:
        httpOptions?.baseURL ?? env.GITHUB_API_URL ?? "https://api.github.com",
      timeout: httpOptions?.timeoutMs ?? env.GITHUB_TIMEOUT_MS ?? 5_000,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "score-github",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  }

  async searchRepositories(
    query: SearchRepositoriesInput,
  ): Promise<SearchRepositoriesResponse> {
    try {
      const response = await this.httpClient.get<GitHubSearchResponseDTO>(
        "/search/repositories",
        {
          params: {
            q: `language:${query.language} created:>=${query.createdAfter}`,
            sort: "stars",
            order: "desc",
            page: String(query.page),
            per_page: String(query.perPage),
          },
        },
      );

      return {
        totalCount: response.data.total_count,
        items: response.data.items.map(this.toRepository),
      };
    } catch (error) {
      const statusCode = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      this.logger.error("GitHub API request failed", {
        statusCode,
        message: error instanceof Error ? error.message : "Unknown axios error",
      });

      if (statusCode === 403 || statusCode === 429) {
        throw new RateLimitError("GitHub API rate limit reached.");
      }

      if (statusCode === 401) {
        throw new GitHubApiError("GitHub API authentication failed.");
      }

      throw new GitHubApiError("Failed to fetch repositories from GitHub.");
    }
  }

  private toRepository(dto: GitHubRepositoryDTO): Repository {
    return {
      id: dto.id,
      name: dto.name,
      fullName: dto.full_name,
      url: dto.html_url,
      description: dto.description,
      language: dto.language,
      stars: dto.stargazers_count,
      forks: dto.forks_count,
      updatedAt: dto.pushed_at,
    };
  }
}
