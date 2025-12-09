/**
 * Test WithOptional with exact server config
 */
import { WithOptional, ResolveOptionType } from '@cli-forge/parser';

// Exact server config from the failing case
type ServerConfig = {
  readonly type: 'object';
  readonly properties: {
    readonly host: { readonly type: 'string'; readonly default: 'localhost' };
    readonly port: { readonly type: 'number'; readonly default: 3000 };
  };
};

// Step 1: Does ServerConfig have required: true?
type HasRequired = ServerConfig extends { required: true } ? 'yes' : 'no';
// @ts-expect-error: Intentional error to see type
const _hasRequired: HasRequired = 'force error';

// Step 2: Does ServerConfig have default: unknown?
type HasDefault = ServerConfig extends { default: unknown } ? 'yes' : 'no';
// @ts-expect-error: Intentional error to see type
const _hasDefault: HasDefault = 'force error';

// Step 3: What does ResolveOptionType give us?
type ResolvedServer = ResolveOptionType<ServerConfig>;
// @ts-expect-error: Intentional error to see type
const _resolvedServer: ResolvedServer = 'force error';

// Step 4: What does WithOptional give us?
type OptionalServer = WithOptional<ResolvedServer, ServerConfig>;
const _optionalServer: OptionalServer = undefined;  // Should work if | undefined is added

// @ts-expect-error: Intentional error to see type
const _optionalServer2: OptionalServer = 'force error';
