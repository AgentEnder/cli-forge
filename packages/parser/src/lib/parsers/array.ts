import { Internal, ArrayOptionConfig } from '../option-types';
import { isNextFlag } from '../utils/flags';
import { Parser, ParserContext } from './typings';

const quotePairs = {
  '"': '"',
  "'": "'",
  '`': '`',
} as const;
const csvParser = (str: string) => {
  const collected = [];
  let val = '';
  let inQuote: keyof typeof quotePairs | false = false;
  for (const char of str) {
    if (inQuote) {
      if (char === quotePairs[inQuote]) {
        inQuote = false;
      } else {
        val += char;
      }
    } else {
      if (char in quotePairs) {
        inQuote = char as keyof typeof quotePairs;
      } else if (char === ',') {
        collected.push(val);
        val = '';
      } else {
        val += char;
      }
    }
  }
  collected.push(val);
  return collected;
};

export const arrayParser: Parser<Internal<ArrayOptionConfig>> = <
  T extends string | number
>({
  config,
  tokens,
  current,
}: ParserContext<Internal<ArrayOptionConfig>>) => {
  const coerce =
    config.items === 'string'
      ? (s: string) => s as T
      : (s: string) => Number(s) as T;
  let val = tokens.shift();
  if (val && val.includes(',')) {
    return csvParser(val).map(coerce);
  }
  const collected: string[] = [];
  while (val) {
    if (isNextFlag(val)) {
      tokens.unshift(val);
      break;
    }
    collected.push(val);
    val = tokens.shift();
  }
  const coerced = collected.map(coerce);
  return current ? current.concat(coerced) : coerced;
};
