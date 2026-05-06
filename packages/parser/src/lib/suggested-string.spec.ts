import { describe, expect, it } from 'vitest';
import {
  calculateSuggestedString,
  damerauLevenshteinDistance,
} from './suggested-string';

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

describe('calculateSuggestedString', () => {
  it('returns undefined when there are no candidates', () => {
    expect(calculateSuggestedString('serve', [])).toBeUndefined();
  });

  it('returns an exact match', () => {
    expect(calculateSuggestedString('serve', ['serve', 'build'])).toBe(
      'serve'
    );
  });

  it('returns the closest candidate for a single-edit typo', () => {
    expect(calculateSuggestedString('sevre', ['serve', 'build', 'test'])).toBe(
      'serve'
    );
  });

  it('matches case-insensitively', () => {
    expect(calculateSuggestedString('SERVE', ['serve', 'build'])).toBe(
      'serve'
    );
    expect(calculateSuggestedString('Sevre', ['Serve', 'Build'])).toBe(
      'Serve'
    );
  });

  it('returns undefined when no candidate is within the length-scaled threshold', () => {
    expect(calculateSuggestedString('xyzab', ['serve', 'build'])).toBeUndefined();
  });

  it('uses a minimum threshold of 1 even for short inputs', () => {
    expect(calculateSuggestedString('ls', ['lt'])).toBe('lt');
  });

  it('allows more edits as the input grows longer', () => {
    expect(calculateSuggestedString('migration', ['migrate', 'seed'])).toBe(
      'migrate'
    );
  });

  it('picks the candidate with the smallest distance when several are within threshold', () => {
    expect(calculateSuggestedString('serv', ['serves', 'serve'])).toBe(
      'serve'
    );
  });
});
