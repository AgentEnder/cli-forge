/**
 * Debug which overload is being selected
 */
import { parser, ObjectOptionConfig, ResolveProperties } from '@cli-forge/parser';

// Simple function to test ObjectOptionConfig matching
function testObjectOption<
  TCoerce,
  const TProps extends Record<string, { type: string }>,
  TAdditionalProps extends false | 'string' | 'number' | 'boolean' = false
>(
  config: ObjectOptionConfig<TCoerce, TProps, TAdditionalProps>
): {
  coerce: TCoerce;
  props: TProps;
  resolved: ResolveProperties<TProps>;
} {
  return {} as any;
}

// Test 1: Simple nested object - should work
const test1 = testObjectOption({
  type: 'object',
  properties: {
    server: {
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 3000 },
      },
    },
  },
  coerce: (val) => val,
  default: { server: { host: 'localhost', port: 3000 } },
});

type Test1Coerce = typeof test1.coerce;
//   ^?
type Test1Props = typeof test1.props;
//   ^?
type Test1Resolved = typeof test1.resolved;
//   ^?

// Test 2: Two nested objects - does inference break?
const test2 = testObjectOption({
  type: 'object',
  properties: {
    server: {
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 3000 },
      },
    },
    database: {
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
      },
    },
  },
  coerce: (val) => val,
  default: { server: { host: 'localhost', port: 3000 } },
});

type Test2Coerce = typeof test2.coerce;
//   ^?
type Test2Props = typeof test2.props;
//   ^?
type Test2Resolved = typeof test2.resolved;
//   ^?
