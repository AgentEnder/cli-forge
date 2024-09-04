import { OptionConfig } from '../option-types';

export type ParserContext<TConfig extends OptionConfig> = {
  config: TConfig;
  tokens: string[];
  current?: any;
  providedFlag?: string;
};
export type Parser<TConfig extends OptionConfig, T = any> = (
  input: ParserContext<TConfig>
) => T;
export class NoValueError extends Error {
  constructor() {
    super('Expected a value');
  }
}
