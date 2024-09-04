import { booleanParser } from './boolean';
import { stringParser } from './string';
import { numberParser } from './number';
import { arrayParser } from './array';
import { objectParser } from './object';
import { Parser } from './typings';

export const parserMap: Record<string, Parser<any>> = {
  string: stringParser,
  number: numberParser,
  boolean: booleanParser,
  array: arrayParser,
  object: objectParser,
};
