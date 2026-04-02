import type { Repository } from "./repository";

export interface ScoredRepository extends Repository {
  popularityScore: number;
}
