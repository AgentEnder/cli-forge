export function damerauLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0)
  );

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }

  return dp[a.length][b.length];
}

export function findClosestCommand(
  input: string,
  candidates: string[]
): string | undefined {
  if (candidates.length === 0) return undefined;

  const threshold = Math.max(1, Math.floor(input.length / 3));
  const lowered = input.toLowerCase();

  let best: { name: string; distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = damerauLevenshteinDistance(
      lowered,
      candidate.toLowerCase()
    );
    if (distance <= threshold && (!best || distance < best.distance)) {
      best = { name: candidate, distance };
    }
  }

  return best?.name;
}
