import { ScoredRepository } from "@/application/domain/entities/scored-repository";

export interface SearchPopularRepositoriesResponseDto {
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
