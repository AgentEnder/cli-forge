import { Internal, ObjectOptionConfig, OptionConfig } from '../option-types';
import { tryParseValue } from '../parser';
import { parserMap } from './parser-map';
import { Parser } from './typings';

export const objectParser: Parser<Internal<ObjectOptionConfig>> = ({
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
    throw new Error(
      `${config.key} is configured as an object, but no properties were provided. Pass properties like so: --${config.key}.foo bar --${config.key}.baz qux`
    );
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
    config: OptionConfig;
  } {
    const propParts = [...parts];
    let currentObject = current;
    let currentKey = propParts.shift();
    let currentValue: any;
    let currentConfig: OptionConfig = config;
    let last: string;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!currentKey) {
        return {
          readValue() {
            return currentValue;
          },
          setValue(v) {
            currentObject[last] = v;
          },
          config: currentConfig,
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
      const c = (currentConfig as ObjectOptionConfig).properties[last];
      if (!c) {
        if (
          'additionalProperties' in currentConfig &&
          currentConfig.additionalProperties
        ) {
          currentConfig = {
            type: currentConfig.additionalProperties,
          };
        } else {
          throw new Error(
            `No configuration found for ${last} in ${config.key}`
          );
        }
      } else {
        currentConfig = c;
      }
    }
  }
};
