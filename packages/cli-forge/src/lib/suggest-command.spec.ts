import { describe, it, expect } from 'vitest';
import { damerauLevenshteinDistance, findClosestCommand } from './suggest-command';

describe('damerauLevenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(damerauLevenshteinDistance('serve', 'serve')).toBe(0);
    expect(damerauLevenshteinDistance('', '')).toBe(0);
  });

  it('returns the length of the other string when one is empty', () => {
    expect(damerauLevenshteinDistance('', 'serve')).toBe(5);
    expect(damerauLevenshteinDistance('build', '')).toBe(5);
  });

  it('counts a single insertion, deletion, or substitution as 1 edit', () => {
    expect(damerauLevenshteinDistance('serve', 'serves')).toBe(1);
    expect(damerauLevenshteinDistance('serves', 'serve')).toBe(1);
    expect(damerauLevenshteinDistance('serve', 'sarve')).toBe(1);
  });

  it('counts an adjacent transposition as 1 edit (Damerau, not plain Levenshtein)', () => {
    expect(damerauLevenshteinDistance('sevre', 'serve')).toBe(1);
    expect(damerauLevenshteinDistance('migarte', 'migrate')).toBe(1);
  });

  it('does not collapse non-adjacent swaps into 1 edit', () => {
    expect(damerauLevenshteinDistance('abcd', 'dbca')).toBeGreaterThan(1);
  });

  it('accumulates edits for multiple changes', () => {
    expect(damerauLevenshteinDistance('kitten', 'sitting')).toBe(3);
  });
});

describe('findClosestCommand', () => {
  it('returns undefined when there are no candidates', () => {
    expect(findClosestCommand('serve', [])).toBeUndefined();
  });

  it('returns an exact match', () => {
    expect(findClosestCommand('serve', ['serve', 'build'])).toBe('serve');
  });

  it('returns the closest candidate for a single-edit typo', () => {
    expect(findClosestCommand('sevre', ['serve', 'build', 'test'])).toBe('serve');
  });

  it('matches case-insensitively', () => {
    expect(findClosestCommand('SERVE', ['serve', 'build'])).toBe('serve');
    expect(findClosestCommand('Sevre', ['Serve', 'Build'])).toBe('Serve');
  });

  it('returns undefined when no candidate is within the length-scaled threshold', () => {
    // input length 5 → threshold = floor(5/3) = 1; "build" → "serve" is 4 edits
    expect(findClosestCommand('xyzab', ['serve', 'build'])).toBeUndefined();
  });

  it('uses a minimum threshold of 1 even for short inputs', () => {
    // input length 2 → floor(2/3) = 0, but the floor of 1 still allows a 1-edit match
    expect(findClosestCommand('ls', ['lt'])).toBe('lt');
  });

  it('allows more edits as the input grows longer', () => {
    // input length 9 → threshold = 3; 'migration' → 'migrate' is 3 edits
    expect(findClosestCommand('migration', ['migrate', 'seed'])).toBe('migrate');
  });

  it('picks the candidate with the smallest distance when several are within threshold', () => {
    // 'serv' is 1 edit from 'serve', 2 from 'serves' → prefer 'serve'
    expect(findClosestCommand('serv', ['serves', 'serve'])).toBe('serve');
  });
});
