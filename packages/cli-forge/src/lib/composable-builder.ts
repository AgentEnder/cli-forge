import { ParsedArgs } from '@cli-forge/parser';
import { CLI } from './public-api';

export function makeComposableBuilder<T2 extends ParsedArgs>(
  fn: (init: CLI<ParsedArgs>) => CLI<T2>
) {
  return <TInit extends ParsedArgs>(init: CLI<TInit>) =>
    fn(init) as CLI<TInit & T2>;
}
