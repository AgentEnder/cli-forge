import { CommonOptionConfig } from './common';
import { OptionConfig } from './option-config';

export interface ObjectOptionConfig<
  TCoerce = Record<string, string>,
  TProperties extends {
    [key: string]: Readonly<OptionConfig>;
  } = Record<string, any>
> extends Omit<CommonOptionConfig<Record<string, string>, TCoerce>, 'choices'> {
  type: 'object';
  /** */
  properties: TProperties;
  additionalProperties?: false | 'string' | 'number' | 'boolean';
}
