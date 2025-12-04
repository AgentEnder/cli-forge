/**
 * Test file to trace type inference issue
 */

import { ResolveProperties, AdditionalPropertiesType } from '@cli-forge/parser';

// What does ResolveProperties<any> resolve to?
type TestAny = ResolveProperties<any>;
//   ^?

// What does ResolveProperties with explicit type resolve to?
type TestExplicit = ResolveProperties<{ foo: { type: 'string' } }>;
//   ^?

// What does ObjectValue look like with any?
type ObjectValueAny = ResolveProperties<any> & AdditionalPropertiesType<false>;
//   ^?

// What does ObjectValue look like with explicit props?
type ObjectValueExplicit = ResolveProperties<{ foo: { type: 'string' } }> &
  AdditionalPropertiesType<false>;
//   ^?

// Test with Record<string, any> (the default)
type TestDefault = ResolveProperties<Record<string, any>>;
//   ^?

// Test what the coerce parameter would be with Record<string, any>
type CoerceParamDefault = ResolveProperties<Record<string, any>> &
  AdditionalPropertiesType<false>;
//   ^?
