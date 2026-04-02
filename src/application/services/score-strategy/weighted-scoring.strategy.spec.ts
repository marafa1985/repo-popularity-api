import { WeightedScoringStrategy } from "./weighted-scoring.strategy";

describe("WeightedScoringAlgorithm", () => {
  const FIXED_NOW = new Date("2026-04-01T00:00:00.000Z").getTime();

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("gives higher scores to repositories with stronger signals", () => {
    const algorithm = new WeightedScoringStrategy();

    const weakerRepository = {
      id: 1,
      name: "weaker",
      fullName: "owner/weaker",
      url: "https://github.com/owner/weaker",
      description: null,
      language: "TypeScript",
      stars: 100,
      forks: 20,
      updatedAt: "2025-04-01T00:00:00.000Z",
    };
    const strongerRepository = {
      id: 2,
      name: "stronger",
      fullName: "owner/stronger",
      url: "https://github.com/owner/stronger",
      description: null,
      language: "TypeScript",
      stars: 50_000,
      forks: 10_000,
      updatedAt: "2026-03-31T00:00:00.000Z",
    };

    expect(algorithm.score(strongerRepository)).toBeGreaterThan(
      algorithm.score(weakerRepository),
    );
  });

  it("caps the maximum score at 100", () => {
    const algorithm = new WeightedScoringStrategy();

    const score = algorithm.score({
      id: 1,
      name: "extreme",
      fullName: "owner/extreme",
      url: "https://github.com/owner/extreme",
      description: null,
      language: "TypeScript",
      stars: 10 ** 9,
      forks: 10 ** 9,
      updatedAt: "2026-04-01T00:00:00.000Z",
    });

    expect(score).toBe(100);
  });

  it("reduces the score for stale repositories", () => {
    const algorithm = new WeightedScoringStrategy();

    const recentScore = algorithm.score({
      id: 1,
      name: "recent",
      fullName: "owner/recent",
      url: "https://github.com/owner/recent",
      description: null,
      language: "TypeScript",
      stars: 1_000,
      forks: 250,
      updatedAt: "2026-03-30T00:00:00.000Z",
    });
    const staleScore = algorithm.score({
      id: 2,
      name: "stale",
      fullName: "owner/stale",
      url: "https://github.com/owner/stale",
      description: null,
      language: "TypeScript",
      stars: 1_000,
      forks: 250,
      updatedAt: "2023-04-01T00:00:00.000Z",
    });

    expect(recentScore).toBeGreaterThan(staleScore);
  });

  it("returns a finite score when updatedAt cannot be parsed as a date", () => {
    const algorithm = new WeightedScoringStrategy();

    const score = algorithm.score({
      id: 1,
      name: "broken-date",
      fullName: "owner/broken-date",
      url: "https://github.com/owner/broken-date",
      description: null,
      language: "TypeScript",
      stars: 100,
      forks: 20,
      updatedAt: "not-a-date",
    });

    expect(Number.isFinite(score)).toBe(true);
  });

  it("treats future timestamps as fully recent instead of penalizing them", () => {
    const algorithm = new WeightedScoringStrategy();

    const currentScore = algorithm.score({
      id: 1,
      name: "current",
      fullName: "owner/current",
      url: "https://github.com/owner/current",
      description: null,
      language: "TypeScript",
      stars: 2_000,
      forks: 400,
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
    const futureScore = algorithm.score({
      id: 2,
      name: "future",
      fullName: "owner/future",
      url: "https://github.com/owner/future",
      description: null,
      language: "TypeScript",
      stars: 2_000,
      forks: 400,
      updatedAt: "2026-12-01T00:00:00.000Z",
    });

    expect(futureScore).toBe(currentScore);
  });
});
