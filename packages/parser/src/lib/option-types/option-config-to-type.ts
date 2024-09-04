import { OptionConfig } from './option-config';
import { ArrayOptionConfig } from './array';
import { ObjectOptionConfig } from './object';

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
type ArrayItems<TOptionConfig extends OptionConfig> =
  TOptionConfig extends ArrayOptionConfig<string | number>
    ? TOptionConfig['items'] extends 'string'
      ? string
      : number
    : never;
type AdditionalProperties<TOptionConfig extends ObjectOptionConfig> =
  TOptionConfig['additionalProperties'] extends 'string'
    ? Record<string, string>
    : TOptionConfig['additionalProperties'] extends 'number'
    ? Record<string, number>
    : TOptionConfig['additionalProperties'] extends 'boolean'
    ? Record<string, boolean>
    : Record<string, never>;
type ResolveTProperties<TProperties extends Record<string, OptionConfig>> = {
  [key in keyof TProperties]: OptionConfigToType<TProperties[key]>;
};
type InferTChoice<TOptionConfig> = 'choices' extends keyof TOptionConfig
  ? TOptionConfig['choices'] extends Array<infer TChoice>
    ? TChoice
    : never
  : never;
