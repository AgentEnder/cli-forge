import { ArrayOptionConfig } from './array';
import { BooleanOptionConfig } from './boolean';
import { NumberOptionConfig } from './number';
import { ObjectOptionConfig } from './object';
import { OneOfOptionConfig } from './one-of';
import { StringOptionConfig } from './string';

/**
 * Configures an option for the parser. See subtypes for more information.
 * - {@link StringOptionConfig}
 * - {@link NumberOptionConfig}
 * - {@link ArrayOptionConfig}
 * - {@link BooleanOptionConfig}
 * - {@link OneOfOptionConfig}
 *
 * @typeParam TCoerce The return type of the `coerce` function if provided.
 */

export type OptionConfig<
  TCoerce = any,
  TChoices = any[],
  TObjectProps extends Record<string, { type: string }> = Record<string, any>
> =
  | StringOptionConfig<TCoerce, TChoices>
  | NumberOptionConfig<TCoerce, TChoices>
  | ArrayOptionConfig<TCoerce, TChoices>
  | BooleanOptionConfig<TCoerce, TChoices>
  | ObjectOptionConfig<TCoerce, TObjectProps>
  | OneOfOptionConfig<any>;

/**
 * An OptionConfig with generic parameters set for maximum compatibility.
 * Uses `any` for all type parameters to allow maximum assignability.
 */
export type UnknownOptionConfig = OptionConfig<any, any, any>;
