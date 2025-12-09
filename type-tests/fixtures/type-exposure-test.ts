/**
 * Expose actual types through intentional assignment errors
 */
import { ResolveProperties, WithOptional, ResolveOptionType } from '@cli-forge/parser';

// Define the properties type with readonly (simulating const)
type TwoNestedProps = {
  readonly server: {
    readonly type: 'object';
    readonly properties: {
      readonly host: { readonly type: 'string'; readonly default: 'localhost' };
      readonly port: { readonly type: 'number'; readonly default: 3000 };
    };
  };
  readonly database: {
    readonly type: 'object';
    readonly properties: {
      readonly host: { readonly type: 'string'; readonly default: 'localhost' };
    };
  };
};

// Get the resolved type
type Resolved = ResolveProperties<TwoNestedProps>;

// @ts-expect-error: Intentional error to see type
const _resolved: Resolved = 'force error to see type';

// Also check WithOptional for server
type ServerResolved = ResolveOptionType<TwoNestedProps['server']>;
type ServerOptional = WithOptional<ServerResolved, TwoNestedProps['server']>;

// @ts-expect-error: Intentional error to see type
const _serverOptional: ServerOptional = 'force error to see type';
