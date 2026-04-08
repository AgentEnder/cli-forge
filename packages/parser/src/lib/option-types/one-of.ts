import { CommonOptionConfig, Default } from './common';
import { StringOptionConfig } from './string';
import { NumberOptionConfig } from './number';
import { BooleanOptionConfig } from './boolean';
import { ArrayOptionConfig } from './array';
import { ResolveOptionType } from './type-resolution';

/**
 * Properties allowed on each entry in `valueTypes`.
 * These are the per-value-type properties (choices, coerce, validate,
 * description, deprecated) — everything else lives on the top-level config.
 */
type ValueTypeFields =
  | 'type'
  | 'choices'
  | 'coerce'
  | 'validate'
  | 'description'
  | 'deprecated';

export type OneOfStringValueType<TCoerce = string, TChoices = TCoerce[]> =
  Pick<StringOptionConfig<TCoerce, TChoices>, ValueTypeFields>;

export type OneOfNumberValueType<TCoerce = number, TChoices = TCoerce[]> =
  Pick<NumberOptionConfig<TCoerce, TChoices>, ValueTypeFields>;

export type OneOfBooleanValueType<TCoerce = boolean, TChoices = TCoerce[]> =
  Pick<BooleanOptionConfig<TCoerce, TChoices>, ValueTypeFields>;

export type OneOfArrayValueType<
  TCoerce = string | number,
  TChoices = TCoerce[]
> = Pick<ArrayOptionConfig<TCoerce, TChoices>, ValueTypeFields>;

/**
 * A single entry in the `valueTypes` array.
 */
export type OneOfValueTypeEntry =
  | OneOfStringValueType<any, any>
  | OneOfNumberValueType<any, any>
  | OneOfBooleanValueType<any, any>
  | OneOfArrayValueType<any, any>;

/**
 * Resolve the TypeScript type for a single valueTypes entry.
 * Uses the same ResolveOptionType logic as standalone options.
 */
export type ResolveOneOfEntry<T> = ResolveOptionType<T>;

/**
 * Resolve the union type for the entire `valueTypes` tuple.
 * Maps each entry to its resolved type and produces a union.
 */
export type ResolveOneOfValueTypes<T extends readonly OneOfValueTypeEntry[]> =
  ResolveOneOfEntry<T[number]>;

/**
 * Top-level properties for a oneOf option.
 * Excludes choices, coerce, validate (those are per-value-type).
 */
type OneOfTopLevelFields = Pick<
  CommonOptionConfig<any>,
  | 'positional'
  | 'alias'
  | 'env'
  | 'required'
  | 'hidden'
  | 'group'
  | 'description'
  | 'deprecated'
>;

/**
 * Configuration for a `oneOf` option that accepts multiple value types.
 *
 * Each entry in `valueTypes` defines a type the option can accept.
 * At parse time, non-boolean parsers are tried in array order; boolean
 * is always tried last (but has exclusive claim on bare flags, negation,
 * and the literals `true`/`false`).
 *
 * @typeParam TValueTypes Tuple of value type configs for type inference
 */
export type OneOfOptionConfig<
  TValueTypes extends readonly OneOfValueTypeEntry[] = readonly OneOfValueTypeEntry[]
> = OneOfTopLevelFields & {
  type: 'oneOf';
  valueTypes: TValueTypes;
  default?: Default<any>;
};
