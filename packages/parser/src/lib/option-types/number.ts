import { CommonOptionConfig } from './common';

export type NumberOptionConfig<TCoerce = number, TChoices = TCoerce[]> = {
  type: 'number';
} & CommonOptionConfig<number, TCoerce, TChoices>;
