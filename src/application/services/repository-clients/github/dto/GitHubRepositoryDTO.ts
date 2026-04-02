export interface GitHubRepositoryDTO {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
}

export interface GitHubSearchResponseDTO {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepositoryDTO[];
}
