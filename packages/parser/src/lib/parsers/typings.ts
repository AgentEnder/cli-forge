import { UnknownOptionConfig } from '../option-types';

export type ParserContext<TConfig extends UnknownOptionConfig> = {
  config: TConfig;
  tokens: string[];
  current?: any;
  providedFlag?: string;
};
export type Parser<TConfig extends UnknownOptionConfig, T = any> = (
  input: ParserContext<TConfig>
) => T;
export class NoValueError extends Error {
  constructor() {
    super('Expected a value');
  }
}
