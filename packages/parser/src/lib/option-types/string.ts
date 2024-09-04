import { CommonOptionConfig } from './common';

export type StringOptionConfig<TCoerce = string, TChoices = TCoerce[]> = {
  type: 'string';
} & CommonOptionConfig<string, TCoerce, TChoices>;
