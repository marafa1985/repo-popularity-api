import type { Repository } from "@/application/domain/entities/Repository";

export class WeightedScoringAlgorithm {
  // Stars are the strongest popularity signal, so they carry half the score.
  private static readonly STAR_WEIGHT = 0.5;
  // Forks matter, but usually trail stars, so they get a smaller share.
  private static readonly FORK_WEIGHT = 0.3;
  // Recency keeps abandoned repositories from dominating forever.
  private static readonly RECENCY_WEIGHT = 0.2;
  // Log scaling keeps massive projects from flattening the rest of the ranking.
  private static readonly STAR_SCALE = 5;
  private static readonly FORK_SCALE = 4;
  // A repo loses half of its recency bonus roughly once per year.
  private static readonly RECENCY_HALF_LIFE_DAYS = 365;

  score(repository: Repository): number {
    const starsScore = this.normalizeLogScale(
      repository.stars,
      WeightedScoringAlgorithm.STAR_SCALE,
    );
    const forksScore = this.normalizeLogScale(
      repository.forks,
      WeightedScoringAlgorithm.FORK_SCALE,
    );
    const recencyScore = this.calculateRecencyScore(repository.updatedAt);

    const weightedScore =
      starsScore * WeightedScoringAlgorithm.STAR_WEIGHT +
      forksScore * WeightedScoringAlgorithm.FORK_WEIGHT +
      recencyScore * WeightedScoringAlgorithm.RECENCY_WEIGHT;

    return Number((weightedScore * 100).toFixed(2));
  }

  private normalizeLogScale(value: number, scale: number): number {
    const normalized = Math.log10(value + 1) / scale;
    return Math.min(Math.max(normalized, 0), 1);
  }

  private calculateRecencyScore(updatedAt: string): number {
    const updatedAtDate = new Date(updatedAt);
    const ageInDays =
      (Date.now() - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24);
    const decayBase =
      Math.log(2) / WeightedScoringAlgorithm.RECENCY_HALF_LIFE_DAYS;

    return Math.exp(-decayBase * Math.max(ageInDays, 0));
  }
}
