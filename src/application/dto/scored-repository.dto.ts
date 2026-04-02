import { Repository } from "@/application/domain/entities/repository";

export interface SearchRepositoriesResponseDto {
  items: Repository[];
  totalCount: number;
  incompleteResults: boolean;
}
