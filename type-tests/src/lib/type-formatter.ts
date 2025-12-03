/**
 * Type trace tree formatter - visualizes type resolution chains
 * as indented trees with box-drawing characters.
 */

export interface TraceNode {
  typeName: string;
  typeParameters?: Record<string, string>;
  resolvedTo: string;
  children: TraceNode[];
  isUnexpected?: boolean;
  warning?: string;
}

/**
 * Format a complete type trace tree with box-drawing characters.
 *
 * Example output:
 * ```
 * val: Record<string, string> & unknown
 * │
 * ├─ ObjectValue<TProperties, TAdditionalProperties>
 * │  │
 * │  ├─ ResolveProperties<TProperties>
 * │  │  └─ TProperties = Record<string, any>  ⚠️ WIDENED
 * │  │
 * │  └─ AdditionalPropertiesType<false>
 * │     └─ unknown ✓
 * ```
 */
export function formatTraceTree(root: TraceNode): string {
  const lines: string[] = [];

  // Start with the root node's resolved type
  lines.push(root.resolvedTo);

  if (root.children.length > 0) {
    lines.push('│');

    // Format each child with the appropriate prefix
    root.children.forEach((child, index) => {
      const isLast = index === root.children.length - 1;
      const childLines = formatTraceNode(child, '', isLast);
      lines.push(...childLines);
    });
  }

  return lines.join('\n');
}

/**
 * Recursively format a trace node and its children.
 *
 * @param node - The trace node to format
 * @param prefix - The prefix for continuation lines (e.g., '│  ' or '   ')
 * @param isLast - Whether this is the last child of its parent
 * @returns Array of formatted lines
 */
export function formatTraceNode(
  node: TraceNode,
  prefix: string,
  isLast: boolean
): string[] {
  const lines: string[] = [];

  // Choose the connector: └─ for last child, ├─ for others
  const connector = isLast ? '└─' : '├─';

  // Format the main line with type name and parameters
  let mainLine = `${prefix}${connector} ${node.typeName}`;

  if (node.typeParameters && Object.keys(node.typeParameters).length > 0) {
    const params = Object.entries(node.typeParameters)
      .map(([key, value]) => `${key}, ${value}`)
      .join(', ');
    mainLine += `<${params}>`;
  }

  lines.push(mainLine);

  // Determine the prefix for child nodes
  // If this is the last child, use spaces; otherwise, use │
  const childPrefix = prefix + (isLast ? '   ' : '│  ');

  // Add a separator line if there are children
  if (node.children.length > 0) {
    lines.push(`${childPrefix}│`);

    // Format each child
    node.children.forEach((child, index) => {
      const isLastChild = index === node.children.length - 1;
      const childLines = formatTraceNode(child, childPrefix, isLastChild);
      lines.push(...childLines);

      // Add separator between children (but not after the last one)
      if (!isLastChild && node.children.length > 1) {
        lines.push(`${childPrefix}│`);
      }
    });
  } else {
    // Leaf node - show the resolved type with optional warning/checkmark
    let resolvedLine = `${childPrefix}└─ ${node.resolvedTo}`;

    if (node.warning) {
      resolvedLine += `  ⚠️ ${node.warning}`;
    } else if (node.isUnexpected === false) {
      resolvedLine += ' ✓';
    }

    lines.push(resolvedLine);
  }

  return lines;
}

/**
 * Format a simple list of warnings.
 *
 * @param warnings - Array of warning messages
 * @returns Formatted warning list
 */
export function formatWarnings(warnings: string[]): string {
  if (warnings.length === 0) {
    return '';
  }

  const lines = warnings.map(warning => `  ⚠️  ${warning}`);
  return '\nWarnings:\n' + lines.join('\n');
}

/**
 * Format location information (file, line, column).
 *
 * @param location - Source location
 * @returns Formatted location string
 */
export function formatLocation(location: {
  file: string;
  line: number;
  col: number;
}): string {
  return `${location.file}:${location.line}:${location.col}`;
}
