import { ArrayOptionConfig } from './array';
import { BooleanOptionConfig } from './boolean';
import { NumberOptionConfig } from './number';
import { ObjectOptionConfig } from './object';
import { StringOptionConfig } from './string';

/**
 * Configures an option for the parser. See subtypes for more information.
 * - {@link StringOptionConfig}
 * - {@link NumberOptionConfig}
 * - {@link ArrayOptionConfig}
 * - {@link BooleanOptionConfig}
 *
 * @typeParam TCoerce The return type of the `coerce` function if provided.
 */

export type OptionConfig<
  TCoerce = any,
  TChoices = any[],
  TObjectProps extends Record<string, OptionConfig> = Record<string, any>
> =
  | StringOptionConfig<TCoerce, TChoices>
  | NumberOptionConfig<TCoerce, TChoices>
  | ArrayOptionConfig<TCoerce, TChoices>
  | BooleanOptionConfig<TCoerce, TChoices>
  | ObjectOptionConfig<TCoerce, TObjectProps>;
