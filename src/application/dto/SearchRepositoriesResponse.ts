import { Repository } from "@/application/domain/entities/Repository";

export interface SearchRepositoriesResponse {
  items: Repository[];
  totalCount: number;
}
