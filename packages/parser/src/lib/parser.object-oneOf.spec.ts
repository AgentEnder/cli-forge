/**
 * Tests exploring whether coerce or oneOf can support an object property
 * that accepts both structured and shorthand values:
 *
 *   --filter.prs.min=1    (structured: { prs: { min: 1 } })
 *   --filter.prs='>1'     (shorthand:  { prs: '>1' })
 *
 * ## Findings
 *
 * ### 1. coerce cannot bridge the type gap
 *
 * coerce runs AFTER parsing, so it can transform a parsed value but cannot
 * change which *input forms* the parser accepts:
 *   - A property typed as 'string' accepts `--filter.prs='>1'` but rejects
 *     `--filter.prs.min=1` (no `.properties` to traverse).
 *   - A property typed as 'object' accepts `--filter.prs.min=1` via dot-
 *     notation but rejects `--filter.prs='>1'` (providedFlag pass-through
 *     causes the inner object parser to misinterpret the flag).
 *
 * ### 2. oneOf as a property type — partial support
 *
 * oneOf IS registered in parserMap, so the object parser can dispatch to it
 * for direct assignment (`--filter.prs='>1'` → string branch wins). However,
 * dot-notation traversal through a oneOf property fails because `parsePath`
 * casts the config as ObjectOptionConfig and looks for `.properties[nextKey]`,
 * which doesn't exist on a oneOf config.
 *
 * ### 3. providedFlag pass-through issue
 *
 * When the object parser dispatches to a sub-parser for a nested property,
 * it passes `providedFlag` unmodified (e.g. `'--filter.prs'`). If the sub-
 * parser is itself an objectParser, it re-splits the flag and tries to
 * interpret `'prs'` as a sub-property name in its OWN config. This prevents
 * JSON assignment at nested object levels entirely.
 *
 * ### 4. What would be needed
 *
 * To fully support both forms, the object parser's `parsePath` would need to:
 *   a) Recognize `type: 'oneOf'` during path traversal and search the
 *      `valueTypes` array for an object entry that has the needed property.
 *   b) Fix the `providedFlag` pass-through so nested object parsers only
 *      see their own segment of the flag path.
 */
import { parser } from './parser';
import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Part 1: coerce — what it CAN do, and where it falls short
// ─────────────────────────────────────────────────────────────────────────────

describe('coerce on object properties', () => {
  it('can transform a fully-parsed object value', () => {
    // coerce on the outer object receives the complete parsed value
    // and can reshape it arbitrarily.
    const result = parser()
      .option('filter', {
        type: 'object',
        properties: {
          prs: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
            },
          },
        },
        coerce: (val) => ({
          ...val,
          // derive a human-readable summary from the structured form
          prsSummary: val.prs
            ? `${val.prs.min ?? '*'}..${val.prs.max ?? '*'}`
            : undefined,
        }),
      })
      .parse(['--filter.prs.min', '1', '--filter.prs.max', '10']);

    expect(result.filter).toEqual({
      prs: { min: 1, max: 10 },
      prsSummary: '1..10',
    });
  });

  it('can coerce a nested string property value', () => {
    // A property typed as 'string' with coerce can transform the value.
    // This works for --filter.prs='>1', parsing '>1' as a string then coercing.
    const result = parser()
      .option('filter', {
        type: 'object',
        properties: {
          prs: {
            type: 'string',
            coerce: (val: string) => {
              // Parse shorthand like '>1', '>=5', '<10'
              const match = val.match(/^([><=!]+)(\d+)$/);
              if (match) {
                return { operator: match[1], value: Number(match[2]) };
              }
              return { raw: val };
            },
          },
        },
      })
      .parse(['--filter.prs', '>1']);

    expect(result.filter).toEqual({
      prs: { operator: '>', value: 1 },
    });
  });

  it('CANNOT accept dot-notation sub-properties when property is typed as string', () => {
    // When prs is type: 'string', --filter.prs.min=1 fails because
    // parsePath tries to access .properties['min'] on the string config.
    // String configs have no .properties, so this is a TypeError.
    expect(() =>
      parser()
        .option('filter', {
          type: 'object',
          properties: {
            prs: {
              type: 'string',
            },
          },
        })
        .parse(['--filter.prs.min', '1'])
    ).toThrow();
  });

  it('CANNOT accept a plain string when property is typed as object', () => {
    // When prs is type: 'object', --filter.prs='>1' fails because of the
    // providedFlag pass-through issue: the inner objectParser receives
    // providedFlag='--filter.prs', splits it to ['prs'], and tries to look
    // up 'prs' in its own properties ({min: ...}), which doesn't exist.
    expect(() =>
      parser()
        .option('filter', {
          type: 'object',
          properties: {
            prs: {
              type: 'object',
              properties: {
                min: { type: 'number' },
              },
            },
          },
        })
        .parse(['--filter.prs', '>1'])
    ).toThrow(/No configuration found/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 2: oneOf — works as top-level option, partial support as property type
// ─────────────────────────────────────────────────────────────────────────────

describe('oneOf as object property type', () => {
  it('works as a top-level option accepting both string and number', () => {
    const p = parser().option('prs', {
      type: 'oneOf',
      valueTypes: [{ type: 'number' }, { type: 'string' }],
    });

    expect(p.parse(['--prs', '5']).prs).toBe(5);
    expect(p.parse(['--prs', '>1']).prs).toBe('>1');
  });

  it('can parse a direct property value when used as a property type (string wins)', () => {
    // When the property is set directly (--filter.prs '>1'), the object
    // parser's parsePath returns the oneOf config, and tryParseValue
    // dispatches to oneOfParser which tries each valueType in order.
    // The string parser succeeds for '>1'.
    const result = parser()
      .option('filter', {
        type: 'object',
        properties: {
          prs: {
            type: 'oneOf',
            valueTypes: [{ type: 'string' }, { type: 'number' }],
          } as any, // 'oneOf' not in the property type union — must cast
        },
      })
      .parse(['--filter.prs', '>1']);

    expect(result.filter).toEqual({ prs: '>1' });
  });

  it('can parse a direct property value when used as a property type (number wins)', () => {
    const result = parser()
      .option('filter', {
        type: 'object',
        properties: {
          prs: {
            type: 'oneOf',
            valueTypes: [{ type: 'number' }, { type: 'string' }],
          } as any,
        },
      })
      .parse(['--filter.prs', '5']);

    expect(result.filter).toEqual({ prs: 5 });
  });

  it('CANNOT traverse dot-notation into a oneOf property with an object branch', () => {
    // --filter.prs.min=1 should ideally find the object branch in oneOf's
    // valueTypes and traverse into it. Currently parsePath casts the config
    // as ObjectOptionConfig and accesses .properties['min']. A oneOf config
    // has no .properties, so this throws.
    expect(() =>
      parser()
        .option('filter', {
          type: 'object',
          properties: {
            prs: {
              type: 'oneOf',
              valueTypes: [
                {
                  type: 'object',
                  properties: { min: { type: 'number' } },
                },
                { type: 'string' },
              ],
            } as any,
          },
        })
        .parse(['--filter.prs.min', '1'])
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 3: providedFlag pass-through prevents JSON at nested object levels
// ─────────────────────────────────────────────────────────────────────────────

describe('providedFlag pass-through issue with nested objects', () => {
  it('JSON at the top level works', () => {
    // Providing JSON at the top-level object works fine.
    const result = parser()
      .option('filter', {
        type: 'object',
        properties: {
          prs: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
            },
          },
        },
      })
      .parse(['--filter', '{"prs":{"min":1,"max":10}}']);

    expect(result.filter).toEqual({ prs: { min: 1, max: 10 } });
  });

  it('full dot-notation to leaf properties works', () => {
    const result = parser()
      .option('filter', {
        type: 'object',
        properties: {
          prs: {
            type: 'object',
            properties: {
              min: { type: 'number' },
            },
          },
        },
      })
      .parse(['--filter.prs.min', '1']);

    expect(result.filter).toEqual({ prs: { min: 1 } });
  });

  it('CANNOT assign JSON to a nested object property via --parent.child syntax', () => {
    // --filter.prs '{"min":1}' SHOULD work (prs is type: 'object'), but the
    // inner objectParser receives providedFlag='--filter.prs', splits it to
    // ['prs'], and tries to look up 'prs' in {min: ...}. This is the same
    // providedFlag pass-through issue.
    expect(() =>
      parser()
        .option('filter', {
          type: 'object',
          properties: {
            prs: {
              type: 'object',
              properties: {
                min: { type: 'number' },
              },
            },
          },
        })
        .parse(['--filter.prs', '{"min":1}'])
    ).toThrow(/No configuration found/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part 4: workarounds — what IS achievable today
// ─────────────────────────────────────────────────────────────────────────────

describe('available workarounds', () => {
  it('top-level coerce can normalize a string property into structured form', () => {
    // If prs is typed as string, --filter.prs='>1' works and coerce can
    // transform it. But --filter.prs.min=1 will NOT work with this approach.
    const result = parser()
      .option('filter', {
        type: 'object',
        properties: {
          prs: { type: 'string' },
        },
        coerce: (val) => {
          if (typeof val.prs === 'string') {
            const match = (val.prs as string).match(/^([><=!]+)(\d+)$/);
            if (match) {
              return {
                ...val,
                prs: { operator: match[1], value: Number(match[2]) },
              };
            }
          }
          return val;
        },
      })
      .parse(['--filter.prs', '>1']);

    expect(result.filter).toEqual({
      prs: { operator: '>', value: 1 },
    });
  });

  it('top-level JSON with coerce can accept a shorthand string in JSON', () => {
    // At the top level, JSON is parsed first, then coerce can transform.
    // Users write: --filter '{"prs":">1"}' and coerce normalizes.
    const result = parser()
      .option('filter', {
        type: 'object',
        properties: {
          prs: { type: 'string' },
        },
        coerce: (val) => {
          if (typeof val.prs === 'string') {
            const match = (val.prs as string).match(/^([><=!]+)(\d+)$/);
            if (match) {
              return {
                ...val,
                prs: { operator: match[1], value: Number(match[2]) },
              };
            }
          }
          return val;
        },
      })
      .parse(['--filter', '{"prs":">1"}']);

    expect(result.filter).toEqual({
      prs: { operator: '>', value: 1 },
    });
  });
});
