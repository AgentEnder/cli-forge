/**
 * Test using the actual package import
 */
import { WithOptional, ResolveOptionType, ResolveProperties } from '@cli-forge/parser';

// Define config
type ServerConfig = {
  readonly type: 'object';
  readonly properties: {
    readonly host: { readonly type: 'string'; readonly default: 'localhost' };
  };
};

// Test WithOptional from package
type ServerResolved = ResolveOptionType<ServerConfig>;
type ServerWithOptional = WithOptional<ServerResolved, ServerConfig>;

// Can we assign undefined?
const test1: ServerWithOptional = undefined;  // Should work if | undefined is added

// Full test with ResolveProperties
type Props = {
  readonly server: ServerConfig;
};

type ResolvedProps = ResolveProperties<Props>;

// Can we assign { server: undefined }?
const test2: ResolvedProps = { server: undefined };  // Should work
