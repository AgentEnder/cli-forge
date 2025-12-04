/**
 * Test if readonly affects WithOptional matching
 */
import { WithOptional, ResolveOptionType, ResolveProperties } from '@cli-forge/parser';

// Mutable config
type MutableServerConfig = {
  type: 'object';
  properties: {
    host: { type: 'string'; default: 'localhost' };
  };
};

// Readonly config (from const)
type ReadonlyServerConfig = {
  readonly type: 'object';
  readonly properties: {
    readonly host: { readonly type: 'string'; readonly default: 'localhost' };
  };
};

// Does the config have 'default: unknown'?
type MutableHasDefault = MutableServerConfig extends { default: unknown } ? 'yes' : 'no';
//   ^? should be 'no'

type ReadonlyHasDefault = ReadonlyServerConfig extends { default: unknown } ? 'yes' : 'no';
//   ^? should be 'no'

// Does the config have 'required: true'?
type MutableHasRequired = MutableServerConfig extends { required: true } ? 'yes' : 'no';
//   ^? should be 'no'

type ReadonlyHasRequired = ReadonlyServerConfig extends { required: true } ? 'yes' : 'no';
//   ^? should be 'no'

// What does WithOptional return?
type ResolvedMutable = ResolveOptionType<MutableServerConfig>;
//   ^?

type ResolvedReadonly = ResolveOptionType<ReadonlyServerConfig>;
//   ^?

type MutableWithOptional = WithOptional<ResolvedMutable, MutableServerConfig>;
//   ^? should have | undefined

type ReadonlyWithOptional = WithOptional<ResolvedReadonly, ReadonlyServerConfig>;
//   ^? should have | undefined

// Full ResolveProperties test
type MutableProps = {
  server: MutableServerConfig;
};

type ReadonlyProps = {
  readonly server: ReadonlyServerConfig;
};

type ResolvedMutableProps = ResolveProperties<MutableProps>;
//   ^?

type ResolvedReadonlyProps = ResolveProperties<ReadonlyProps>;
//   ^?
