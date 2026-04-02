import type { SearchRepositoriesQueryDto } from "@/application/dto/search-repositories-query.dto";
import axios from "axios";

import type { ILogger } from "@/application/ports/ILogger";
import type { SearchRepositoriesResponse } from "@/application/dto/scored-repository.dto";
import type { Repository } from "@/application/domain/entities/repository";
import {
  GitHubApiError,
  RateLimitError,
} from "@/application/domain/errors/application.error";
import type {
  GitHubRepositoryDTO,
  GitHubSearchResponseDTO,
} from "./dto/github-repository.dto";

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
      baseURL: httpOptions?.baseURL ?? "https://api.github.com",
      timeout: httpOptions?.timeoutMs ?? 5_000,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "score-github",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  }

  async searchRepositories(
    query: SearchRepositoriesQueryDto,
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
