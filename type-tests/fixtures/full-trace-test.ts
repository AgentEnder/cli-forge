/**
 * Full trace of the type resolution
 */
import {
  ObjectOptionConfig,
  ResolveProperties,
  WithOptional,
  MakeUndefinedPropertiesOptional,
  WithAdditionalProperties,
} from '@cli-forge/parser';

// Simulated TProps from const inference
type TProps = {
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

// Step 1: What does ResolveProperties give us?
type ResolvedProps = ResolveProperties<TProps>;

// Step 2: Verify nested properties are optional (have | undefined)
const testServerUndefined: ResolvedProps = {
  server: undefined,
  database: undefined,
};

// Step 3: What does the full ObjectConfig look like when user provides default?
type TCoerce = ResolvedProps; // When coerce returns val, TCoerce = input type
type TAdditionalProps = false;

type ConfigType = ObjectOptionConfig<TCoerce, TProps, TAdditionalProps>;

// Does ConfigType have 'default: unknown'?
type ConfigHasDefault = ConfigType extends { default: unknown } ? 'yes' : 'no';
// @ts-expect-error: Intentional error to see type
const _configHasDefault: ConfigHasDefault = 'force error';

// Step 4: What is the final WithOptional result?
type FinalType = MakeUndefinedPropertiesOptional<
  WithOptional<
    unknown extends TCoerce
      ? WithAdditionalProperties<ResolveProperties<TProps>, TAdditionalProps>
      : TCoerce,
    ConfigType
  >
>;

// Can we assign to FinalType with missing properties?
const testFinal: FinalType = { server: { host: 'x', port: 3000 } };
