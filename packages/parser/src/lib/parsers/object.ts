import {
  Internal,
  ObjectOptionConfig,
  UnknownOptionConfig,
} from '../option-types';
import { tryParseValue } from '../parser';
import { parserMap } from './parser-map';
import { Parser } from './typings';

export const objectParser: Parser<Internal<ObjectOptionConfig<any, any>>> =
  ({
  tokens,
  config,
  providedFlag,
  current,
}) => {
  current ??= {};
  // `providedFlag` is the flag that was used on the cli.
  // it will look like `env.foo.bar`, or `env.foo`. for dot notation
  //
  // We don't care about the first part, as the base parser has already matched the flag.
  const parts = providedFlag?.split('.').slice(1);
  if (!parts?.length) {
    // When no dot notation is provided (e.g., just --config), try to parse as JSON string
    const token = tokens.shift();
    if (!token) {
      throw new Error(
        `${config.key} is configured as an object, but no value was provided. Pass properties like so: --${config.key}.foo bar --${config.key}.baz qux, or provide a JSON string: --${config.key} '{"foo": "bar"}'`
      );
    }

    try {
      const parsed = JSON.parse(token);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          `Expected ${config.key} to be a JSON object, but got ${typeof parsed}`
        );
      }
      // Merge parsed JSON with existing values, with JSON taking precedence (last value wins)
      // This matches the behavior of dot notation where later flags override earlier ones
      return { ...current, ...parsed };
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(
          `Failed to parse ${config.key} as JSON: ${e.message}. Either provide a valid JSON string or use dot notation: --${config.key}.foo bar`
        );
      }
      throw e;
    }
  }
  const { config: propConfig, readValue, setValue } = parsePath(parts);
  const currentValue = readValue();
  const parsedValue = tryParseValue(parserMap[propConfig.type], {
    config: {
      ...propConfig,
      key: `${config.key}.${parts.join('.')}`,
    },
    tokens,
    current: currentValue,
    providedFlag: providedFlag,
  });
  setValue(parsedValue);

  return current;

  function parsePath(parts: string[]): {
    readValue(): any;
    setValue(v: any): void;
    config: ObjectOptionConfig<any, any>;
  } {
    const propParts = [...parts];
    let currentObject = current;
    let currentKey = propParts.shift();
    let currentValue: any;
    let currentConfig: UnknownOptionConfig = config;
    let last: string;
     
    while (true) {
      if (!currentKey) {
        return {
          readValue() {
            return currentValue;
          },
          setValue(v) {
            currentObject[last] = v;
          },
          config: currentConfig as ObjectOptionConfig<any, any>,
        };
      }
      const nextKey = propParts.shift();
      currentValue = currentObject[currentKey];
      if (nextKey) {
        if (currentValue && typeof currentValue !== 'object') {
          throw new Error(
            `Expected ${currentKey} to be an object, but found ${typeof currentValue}`
          );
        } else {
          currentObject[currentKey] ??= {};
        }
      }
      last = currentKey;
      currentKey = nextKey;
      if (nextKey) {
        currentObject = currentObject[last];
      }
      const c = (currentConfig as ObjectOptionConfig<any, any>).properties[
        last
      ];
      if (!c) {
        throw new Error(`No configuration found for ${last} in ${config.key}`);
      }
      currentConfig = c;
    }
  }
};
