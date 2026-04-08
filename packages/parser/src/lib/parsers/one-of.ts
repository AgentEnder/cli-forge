import { OneOfOptionConfig, OneOfValueTypeEntry } from '../option-types/one-of';
import { Internal, InternalOptionConfig } from '../option-types';
import { Parser, ParserContext, NoValueError } from './typings';
import { parserMap } from './parser-map';

export const oneOfParser: Parser<Internal<OneOfOptionConfig<any>>> = (
  input: ParserContext<Internal<OneOfOptionConfig<any>>>
) => {
  const { config, tokens, providedFlag } = input;
  const valueTypes = config.valueTypes;

  const hasBooleanType = valueTypes.some(
    (vt: OneOfValueTypeEntry) => vt.type === 'boolean'
  );
  const isNegated = providedFlag?.startsWith('--no-');
  const nextToken = tokens[0];

  // Boolean-exclusive cases: bare flag, negation, true/false literals
  if (hasBooleanType) {
    const booleanValueType = valueTypes.find(
      (vt: OneOfValueTypeEntry) => vt.type === 'boolean'
    );

    // --no-flag → false
    if (isNegated) {
      // Consume true/false literal if present (--no-flag true → false, --no-flag false → true)
      if (nextToken === 'true' || nextToken === 'false') {
        tokens.shift();
        const parsed = nextToken === 'true';
        const result = !parsed;
        return applyValueTypePostProcessing(booleanValueType!, result);
      }
      return applyValueTypePostProcessing(booleanValueType!, false);
    }

    // --flag true / --flag false → boolean
    if (nextToken === 'true' || nextToken === 'false') {
      tokens.shift();
      const result = nextToken === 'true';
      return applyValueTypePostProcessing(booleanValueType!, result);
    }

    // --flag (bare, no next token or next token is a flag)
    if (nextToken === undefined || nextToken.startsWith('-')) {
      return applyValueTypePostProcessing(booleanValueType!, true);
    }
  } else {
    // No boolean type — negation and bare flags are errors
    if (isNegated) {
      throw new NoValueError();
    }
  }

  // Try non-boolean parsers in array order
  const nonBooleanTypes = valueTypes.filter(
    (vt: OneOfValueTypeEntry) => vt.type !== 'boolean'
  );

  // Track the last choices/validate failure for error reporting
  let lastChoicesError: string | undefined;

  for (const valueType of nonBooleanTypes) {
    const subParser = parserMap[valueType.type];
    if (!subParser) continue;

    // Save token position to restore on failure
    const savedTokens = [...tokens];
    try {
      const result = subParser({
        config: {
          ...config,
          ...valueType,
          key: config.key,
        } as InternalOptionConfig,
        tokens,
        current: input.current,
        providedFlag,
      });

      // For number parser: check if the result is NaN (invalid number)
      if (valueType.type === 'number' && isNaN(result as number)) {
        // Restore tokens and try next parser
        tokens.length = 0;
        tokens.push(...savedTokens);
        continue;
      }

      // Apply per-value-type choices validation
      if ('choices' in valueType && valueType.choices) {
        const choices =
          typeof valueType.choices === 'function'
            ? valueType.choices()
            : valueType.choices;
        if (Array.isArray(choices) && !choices.includes(result)) {
          // Record the failure for error reporting
          lastChoicesError = `Invalid value for ${config.key}: "${result}". Choices: ${choices.join(', ')}`;
          // Choices failed — restore tokens and try next parser
          tokens.length = 0;
          tokens.push(...savedTokens);
          continue;
        }
      }

      // Apply per-value-type coerce
      const coerced = valueType.coerce
        ? (valueType.coerce as (v: any) => any)(result)
        : result;

      // Apply per-value-type validate
      if (valueType.validate) {
        const validationResult = (
          valueType.validate as (v: any) => boolean | string
        )(coerced);
        if (
          validationResult === false ||
          typeof validationResult === 'string'
        ) {
          tokens.length = 0;
          tokens.push(...savedTokens);
          continue;
        }
      }

      return coerced;
    } catch {
      // Restore tokens and try next parser
      tokens.length = 0;
      tokens.push(...savedTokens);
    }
  }

  // No non-boolean parser matched
  // If we had a choices/validate failure and no fallback is appropriate, throw
  if (lastChoicesError) {
    throw new Error(lastChoicesError);
  }

  // If boolean is available, fall back to it (bare flag case)
  if (hasBooleanType) {
    return true;
  }

  throw new NoValueError();
};

/**
 * Apply per-value-type post-processing (choices, coerce, validate)
 * for boolean matches.
 */
function applyValueTypePostProcessing(
  valueType: OneOfValueTypeEntry,
  result: any
): any {
  // Apply choices
  if ('choices' in valueType && valueType.choices) {
    const choices =
      typeof valueType.choices === 'function'
        ? valueType.choices()
        : valueType.choices;
    if (Array.isArray(choices) && !choices.includes(result)) {
      throw new Error(
        `Invalid value for boolean: ${result}. Choices: ${choices.join(', ')}`
      );
    }
  }

  // Apply coerce
  const coerced = valueType.coerce
    ? (valueType.coerce as (v: any) => any)(result)
    : result;

  // Apply validate
  if (valueType.validate) {
    const validationResult = (
      valueType.validate as (v: any) => boolean | string
    )(coerced);
    if (validationResult === false || typeof validationResult === 'string') {
      const msg =
        typeof validationResult === 'string'
          ? validationResult
          : `Validation failed for value: ${coerced}`;
      throw new Error(msg);
    }
  }

  return coerced;
}
