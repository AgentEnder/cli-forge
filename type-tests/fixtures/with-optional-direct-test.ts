/**
 * Direct test of WithOptional
 */
import { WithOptional } from '@cli-forge/parser';

// Simple resolved type
type ResolvedType = { host: string; port: number };

// Config without default or required
type ConfigNoDefault = {
  readonly type: 'object';
  readonly properties: {};
};

// Apply WithOptional
type Result = WithOptional<ResolvedType, ConfigNoDefault>;

// @ts-expect-error: Intentional error to see type (should be ResolvedType | undefined)
const _result: Result = 'force error';

// Also test manually
type ManualCheck = ConfigNoDefault extends { required: true }
  ? 'has required'
  : ConfigNoDefault extends { default: unknown }
  ? 'has default'
  : 'neither';

// @ts-expect-error: Intentional error to see type
const _manualCheck: ManualCheck = 'force error';
