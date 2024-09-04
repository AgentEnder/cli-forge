import { CommonOptionConfig } from './common';

/**
 * Configuration for array options. Arrays are parsed from
 * comma separated, space separated, or multiple values.
 *
 * e.g. `--foo a b c`, `--foo a,b,c`, or `--foo a --foo b --foo c`
 */
export type ArrayOptionConfig<
  TCoerce = string | number,
  TChoices = TCoerce[]
> =
  | StringArrayOptionConfig<TCoerce, TChoices>
  | NumberArrayOptionConfig<TCoerce, TChoices>;

export type NumberArrayOptionConfig<TCoerce = number, TChoices = number[]> = {
  type: 'array';
  items: 'number';
} & CommonOptionConfig<number[], TCoerce, TChoices>;

export type StringArrayOptionConfig<TCoerce = string, TChoices = TCoerce[]> = {
  type: 'array';
  items: 'string';
} & CommonOptionConfig<string[], TCoerce, TChoices>;
