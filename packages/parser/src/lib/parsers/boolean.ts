import { Internal, BooleanOptionConfig } from '../option-types';
import { Parser } from './typings';

export const booleanParser: Parser<Internal<BooleanOptionConfig>> = ({
  tokens,
  providedFlag,
}) => {
  const negated = providedFlag?.startsWith('--no-');
  const val = tokens.shift();
  const parsed = (() => {
    if (val === undefined) {
      return true;
    }
    if (val === 'true') {
      return true;
    }
    if (val === 'false') {
      return false;
    }
    // Not a boolean literal — put it back for positional/subcommand handling
    tokens.unshift(val);
    return true;
  })();
  return negated ? !parsed : parsed;
};
