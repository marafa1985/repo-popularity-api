import { ScoredRepository } from "@/application/domain/entities/ScoredRepository";

export interface SearchPopularRepositoriesResponse {
  filters: {
    createdAfter: string;
    language: string;
  };
  pagination: {
    page: number;
    perPage: number;
    totalCount: number;
    returnedCount: number;
  };
  items: ScoredRepository[];
}
