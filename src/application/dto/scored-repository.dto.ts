import { Repository } from "@/application/domain/entities/repository";

export interface SearchRepositoriesResponse {
  items: Repository[];
  totalCount: number;
}
