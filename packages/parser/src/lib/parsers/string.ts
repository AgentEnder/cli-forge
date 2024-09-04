import { Internal, StringOptionConfig } from '../option-types';
import { isNextFlag } from '../utils/flags';
import { NoValueError } from './typings';
import { Parser } from './typings';

export const stringParser: Parser<Internal<StringOptionConfig>> = ({
  tokens,
}) => {
  const val = tokens.shift();
  if (val === undefined) {
    throw new NoValueError();
  }
  if (isNextFlag(val)) {
    tokens.unshift(val);
    throw new NoValueError();
  }
  return val;
};
