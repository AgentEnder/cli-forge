/**
 * Test importing WithOptional directly
 */

// Import from the dist file directly
type WithOptionalDist<TResolved, TConfig> = TConfig extends {
  required: true;
} ? TResolved : TConfig extends {
  default: unknown;
} ? TResolved : TResolved | undefined;

// Test it
type Config = { type: 'object' };
type Resolved = { host: string };

type ResultDist = WithOptionalDist<Resolved, Config>;

// @ts-expect-error: Intentional error to see type
const _result: ResultDist = 'force error';
