import { Internal, BooleanOptionConfig } from '../option-types';
import { isNextFlag } from '../utils/flags';
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
    if (isNextFlag(val)) {
      tokens.unshift(val);
      return true;
    }
    if (val === 'false') {
      return false;
    }
    return true;
  })();
  return negated ? !parsed : parsed;
};
