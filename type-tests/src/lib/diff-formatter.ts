/**
 * Type comparison diff formatter - shows differences between
 * expected and actual types with clear visual indicators.
 */

export interface Difference {
  path: string;
  kind: 'missing' | 'extra' | 'type_mismatch' | 'optionality';
  actual?: string;
  expected?: string;
}

/**
 * Format a list of type differences with visual indicators.
 *
 * Example output:
 * ```
 * Differences:
 *   ✗ [root] Type mismatch
 *       Expected: object with explicit properties
 *       Actual:   index signature (Record<string, string>)
 *   ✗ [foo] Missing property
 *       Expected: string
 *   ✗ [bar] Type mismatch
 *       Expected: number | undefined
 *       Actual:   string
 * ```
 */
export function formatDifferences(diffs: Difference[]): string {
  if (diffs.length === 0) {
    return '  ✓ No differences found';
  }

  const lines = diffs.map(diff => {
    const pathLabel = diff.path === '' ? '[root]' : `[${diff.path}]`;
    const kindLabel = formatDiffKind(diff.kind);

    let result = `  ✗ ${pathLabel} ${kindLabel}`;

    if (diff.expected !== undefined) {
      result += `\n      Expected: ${diff.expected}`;
    }

    if (diff.actual !== undefined) {
      result += `\n      Actual:   ${diff.actual}`;
    }

    return result;
  });

  return lines.join('\n');
}

/**
 * Convert a diff kind enum to a human-readable label.
 */
function formatDiffKind(kind: Difference['kind']): string {
  switch (kind) {
    case 'missing':
      return 'Missing property';
    case 'extra':
      return 'Extra property';
    case 'type_mismatch':
      return 'Type mismatch';
    case 'optionality':
      return 'Optionality mismatch';
    default:
      return 'Unknown difference';
  }
}

/**
 * Format a complete type comparison result with optional trace.
 *
 * Example output:
 * ```
 * Comparing type at: PropertyAssignment[name.text="coerce"] > Parameter
 *
 * Expected: { foo: string; bar: number | undefined }
 * Actual:   Record<string, string>
 *
 * Differences:
 *   ✗ [root] Type mismatch
 *       Expected: object with explicit properties
 *       Actual:   index signature (Record<string, string>)
 *
 * Type Resolution Trace:
 * ─────────────────────────────────────────────────────────
 * val: Record<string, string> & unknown
 * │
 * ├─ ObjectValue<TProperties, TAdditionalProperties>
 * │  ├─ ResolveProperties<TProperties>
 * │  │  └─ TProperties = Record<string, any>  ⚠️ WIDENED
 * ```
 */
export function formatCompareResult(
  actual: string,
  expected: string,
  diffs: Difference[],
  trace?: string
): string {
  const lines: string[] = [];

  // Header with expected vs actual
  lines.push(`Expected: ${expected}`);
  lines.push(`Actual:   ${actual}`);
  lines.push('');

  // Differences section
  lines.push('Differences:');
  lines.push(formatDifferences(diffs));

  // Optional trace section
  if (trace) {
    lines.push('');
    lines.push('Type Resolution Trace:');
    lines.push('─'.repeat(57));
    lines.push(trace);
  }

  return lines.join('\n');
}

/**
 * Format a comparison result with a selector context.
 *
 * @param selector - The tsquery selector used to find the type
 * @param actual - The actual inferred type
 * @param expected - The expected type
 * @param diffs - Array of differences
 * @param trace - Optional type resolution trace
 * @returns Formatted comparison output
 */
export function formatCompareWithSelector(
  selector: string,
  actual: string,
  expected: string,
  diffs: Difference[],
  trace?: string
): string {
  const lines: string[] = [];

  lines.push(`Comparing type at: ${selector}`);
  lines.push('');
  lines.push(formatCompareResult(actual, expected, diffs, trace));

  return lines.join('\n');
}

/**
 * Format a success message for matching types.
 *
 * @param actual - The actual type (which matches expected)
 * @returns Formatted success message
 */
export function formatMatchSuccess(actual: string): string {
  return `✓ Types match: ${actual}`;
}

/**
 * Format a summary of comparison results.
 *
 * @param total - Total number of comparisons
 * @param passed - Number of comparisons that matched
 * @returns Formatted summary
 */
export function formatComparisonSummary(total: number, passed: number): string {
  const failed = total - passed;
  const icon = failed === 0 ? '✓' : '✗';

  return `${icon} ${passed}/${total} type comparisons passed`;
}
