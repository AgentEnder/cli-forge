import { CommonOptionConfig } from './common';

export type BooleanOptionConfig<TCoerce = boolean, TChoices = TCoerce[]> = {
  type: 'boolean';
} & CommonOptionConfig<boolean, TCoerce, TChoices>;
