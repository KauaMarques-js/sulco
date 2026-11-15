/** Bounded concurrency; preserves input order and stops scheduling after a failure. */
export async function mapConcurrent<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length); let cursor = 0; let failed = false;
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, async () => {
    while (!failed && cursor < items.length) {
      const index = cursor++;
      try { results[index] = await task(items[index]); } catch (error) { failed = true; throw error; }
    }
  }));
  return results;
}
