/**
 * @cli-forge/type-tests - TypeScript type debugging utilities
 *
 * This library provides utilities for debugging TypeScript type inference issues,
 * specifically for complex generic type resolution in cli-forge.
 */

// Compiler utilities
export {
  createProgramFromFile,
  createTestProgram,
  findTsConfig,
  type ProgramResult,
} from './compiler.js';

// Type walking utilities
export {
  walkType,
  type TypeNode,
  type PropertyInfo,
} from './type-walker.js';

// Query utilities
export {
  findNodeBySelector,
  findAllNodesBySelector,
  CommonSelectors,
} from './query.js';

// Type tracing API
export {
  traceTypeAt,
  traceAllTypesAt,
  type TraceOptions,
  type TraceResult,
} from './trace.js';

// Resolution chain building
export {
  buildResolutionChain,
  getNodeLocation,
} from './resolution-chain.js';

// Type formatting
export {
  formatTraceTree,
  formatWarnings,
  formatLocation,
  type TraceNode,
} from './type-formatter.js';

// Assertion utilities
export {
  runAssertions,
  type AssertionResult,
} from './assert.js';

// Type comparison
export {
  compareTypes,
  type CompareOptions,
  type CompareResult,
} from './type-compare.js';

// Structural comparison
export {
  compareTypeStructure,
} from './structural-compare.js';

// Diff formatting
export {
  type Difference,
  formatDifferences,
  formatCompareResult,
  formatCompareWithSelector,
  formatMatchSuccess,
  formatComparisonSummary,
} from './diff-formatter.js';
