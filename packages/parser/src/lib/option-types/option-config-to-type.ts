import { OptionConfig } from './option-config';
import { ArrayOptionConfig } from './array';
import { ObjectOptionConfig } from './object';

/**
 * Converts an OptionConfig to the TypeScript type for the parsed value.
 */
export type OptionConfigToType<TOptionConfig extends OptionConfig> =
  InferTChoice<TOptionConfig> extends [never]
    ? TOptionConfig['coerce'] extends (s: any) => any
      ? ReturnType<TOptionConfig['coerce']>
      : {
          string: string;
          number: number;
          boolean: boolean;
          array: ArrayItems<TOptionConfig>[];
          object: TOptionConfig extends ObjectOptionConfig
            ? ResolveTProperties<TOptionConfig['properties']> &
                AdditionalProperties<TOptionConfig>
            : never;
        }[TOptionConfig['type']]
    : InferTChoice<TOptionConfig>;

// Resolve the type of the items in an array option
// Items is either:
// - The literal 'string', which we map to string
// - The literal 'number', which we map to number
type ArrayItems<TOptionConfig extends OptionConfig> =
  TOptionConfig extends ArrayOptionConfig<string | number>
    ? TOptionConfig['items'] extends 'string'
      ? string
      : number
    : never;

// Resolve the additional properties of an object option
// Additional properties is either:
// - Not defined, which we map to never
// - The literal 'string', which we map to Record<string, string>
// - The literal 'number', which we map to Record<string, number>
// - The literal 'boolean', which we map to Record<string, boolean>
type AdditionalProperties<TOptionConfig extends ObjectOptionConfig> =
  TOptionConfig['additionalProperties'] extends 'string'
    ? Record<string, string>
    : TOptionConfig['additionalProperties'] extends 'number'
    ? Record<string, number>
    : TOptionConfig['additionalProperties'] extends 'boolean'
    ? Record<string, boolean>
    : Record<string, never>;

// Resolve the properties of an object option
// Each property is itself an OptionConfig, so we need to resolve it to a type
type ResolveTProperties<TProperties extends Record<string, OptionConfig>> = {
  [key in keyof TProperties]: OptionConfigToType<TProperties[key]>;
};

// Infer the type of the choices array
// Choices is either:
// - Not defined, which we map to never
// - A function that returns an array of choices
// - An array of choices
type InferTChoice<TOptionConfig> = 'choices' extends keyof TOptionConfig
  ? TOptionConfig['choices'] extends Array<infer TChoice>
    ? TChoice
    : TOptionConfig['choices'] extends () => Array<infer TChoice>
    ? TChoice
    : never
  : never;
