/**
 * Debug ResolveProperties behavior
 */
import { ResolveProperties, WithOptional, ResolveOptionType } from '@cli-forge/parser';

// Define the properties type directly
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

// What does ResolveProperties give us?
type Resolved = ResolveProperties<TwoNestedProps>;
//   ^?

// Check individual properties
type ServerResolved = ResolveOptionType<TwoNestedProps['server']>;
//   ^?

type ServerWithOptional = WithOptional<ServerResolved, TwoNestedProps['server']>;
//   ^?

// Does server config have 'default'?
type ServerHasDefault = TwoNestedProps['server'] extends { default: unknown } ? true : false;
//   ^?

// The nested object itself doesn't have default, so WithOptional should add | undefined
// But do the nested PROPERTIES have defaults? Let's check:
type ServerProps = TwoNestedProps['server']['properties'];
//   ^?

type ServerHostConfig = ServerProps['host'];
//   ^?

// ServerHostConfig has { default: 'localhost' }, so it should NOT have | undefined
// But the SERVER OBJECT itself doesn't have a default, so SERVER should have | undefined
