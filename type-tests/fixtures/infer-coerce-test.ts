/**
 * Test what TCoerce is actually inferred as
 */
import { ObjectOptionConfig, ResolveProperties, AdditionalPropertiesType } from '@cli-forge/parser';

// Function to capture the inferred TCoerce
function testInference<
  TCoerce,
  const TProps extends Record<string, { type: string }>,
  TAdditionalProps extends false | 'string' | 'number' | 'boolean' = false
>(
  config: ObjectOptionConfig<TCoerce, TProps, TAdditionalProps>
): {
  coerce: TCoerce;
  props: TProps;
  check: unknown extends TCoerce ? 'coerce is unknown' : 'coerce is specific';
  result: unknown extends TCoerce
    ? ResolveProperties<TProps> & AdditionalPropertiesType<TAdditionalProps>
    : TCoerce;
} {
  return {} as any;
}

// Test with coerce that returns val
const test1 = testInference({
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

// What is TCoerce?
type InferredCoerce = typeof test1.coerce;
// @ts-expect-error: Intentional error to see type
const _inferredCoerce: InferredCoerce = 'force error';

// Is coerce unknown or specific?
type CoerceCheck = typeof test1.check;
// @ts-expect-error: Intentional error to see type
const _coerceCheck: CoerceCheck = 'force error';

// What is the result type?
type ResultType = typeof test1.result;
// Both server and database are required keys in the type (though their values can be undefined)
const _resultType: ResultType = { server: undefined, database: undefined };
