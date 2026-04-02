import { InMemoryCacheService } from "./in-memory-cache.service";

describe("InMemoryCacheService", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("evicts the least-recently-used entry when at capacity", () => {
    jest.useFakeTimers();
    const cache = new InMemoryCacheService<number>({
      ttlMs: 60_000,
      maxEntries: 2,
    });

    jest.setSystemTime(0);
    cache.set("a", 1);
    jest.setSystemTime(1);
    cache.set("b", 2);
    jest.setSystemTime(2);
    cache.get("a");
    jest.setSystemTime(3);
    cache.set("c", 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });
});
