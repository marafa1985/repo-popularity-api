import type { Repository } from "./Repository";

export interface ScoredRepository extends Repository {
  popularityScore: number;
}
