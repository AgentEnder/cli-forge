import { CommonOptionConfig, Default } from './common';
import { ResolveProperties, AdditionalPropertiesType } from './type-resolution';

/**
 * Compute the full value type for an object option.
 * Resolves each property to its final type (respecting optional/required)
 * and adds an index signature if additionalProperties is set.
 *
 * Uses a structural constraint for TProperties to avoid circular imports
 * with option-config.ts.
 */
type ObjectValue<
  TProperties extends Record<string, { type: string }>,
  TAdditionalProperties extends false | 'string' | 'number' | 'boolean'
> = ResolveProperties<TProperties> & AdditionalPropertiesType<TAdditionalProperties>;

/**
 * Configuration for object options. Objects are parsed from dot notation
 * or JSON strings.
 *
 * e.g. `--config.host localhost --config.port 3000` or `--config '{"host":"localhost"}'`
 *
 * Note: This type explicitly lists all fields from CommonOptionConfig instead of using
 * Omit<CommonOptionConfig<TValue>, ...> to avoid circular type inference issues.
 * When Omit is used, TypeScript must fully evaluate CommonOptionConfig<TValue> first,
 * which requires computing TValue from TProperties, creating a circular dependency
 * when callbacks reference nested properties.
 */
/**
 * Configuration for object options. Objects are parsed from dot notation
 * or JSON strings.
 *
 * e.g. `--config.host localhost --config.port 3000` or `--config '{"host":"localhost"}'`
 *
 * Note: This type explicitly lists all fields from CommonOptionConfig instead of using
 * Omit<CommonOptionConfig<TValue>, ...> to avoid circular type inference issues.
 * When Omit is used, TypeScript must fully evaluate CommonOptionConfig<TValue> first,
 * which requires computing TValue from TProperties, creating a circular dependency
 * when callbacks reference nested properties.
 */
/**
 * Compute the validate parameter type for object options.
 * When coerce is provided, validate receives the coerced type (TCoerce).
 * When coerce is not provided, validate receives the computed ObjectValue type.
 *
 * Uses `unknown extends TCoerce` to detect if TCoerce was not explicitly provided,
 * since it defaults to `unknown` when no coerce function is given.
 */
type ObjectValidateType<
  TCoerce,
  TProperties extends Record<string, { type: string }>,
  TAdditionalProperties extends false | 'string' | 'number' | 'boolean'
> = unknown extends TCoerce
  ? ObjectValue<TProperties, TAdditionalProperties>
  : TCoerce;

export type ObjectOptionConfig<
  TCoerce,
  TProperties extends Record<string, { type: string }>,
  TAdditionalProperties extends false | 'string' | 'number' | 'boolean' = false
> = {
  // Inherit all common fields EXCEPT choices, coerce, validate, and default
  // - choices: not applicable to objects
  // - coerce, validate: need custom types for proper inference
  // - default: must be defined without double NoInfer wrapping
  [key in keyof Omit<
    CommonOptionConfig<
      ObjectValue<NoInfer<TProperties>, NoInfer<TAdditionalProperties>>,
      NoInfer<TCoerce>
    >,
    'choices' | 'coerce' | 'validate' | 'default'
  >]: CommonOptionConfig<
    ObjectValue<NoInfer<TProperties>, NoInfer<TAdditionalProperties>>,
    NoInfer<TCoerce>
  >[key];
} & {
  type: 'object';
  properties: TProperties;
  additionalProperties?: TAdditionalProperties;
  /**
   * Provide a default value for the entire object.
   * Uses a permissive type (object) to avoid interfering with TProperties inference.
   * The actual type checking happens at runtime.
   */
  default?: Default<object>;
  /**
   * Coerce transforms the parsed object value.
   * The return type becomes the final type for this option.
   */
  coerce?: (
    value: ObjectValue<TProperties, NoInfer<TAdditionalProperties>>
  ) => TCoerce;
  /**
   * Validate the object value after coercion (or the raw value if no coerce).
   * Receives the coerced type if coerce is provided, otherwise the computed ObjectValue type.
   */
  validate?: (
    value: ObjectValidateType<TCoerce, TProperties, TAdditionalProperties>
  ) => boolean | string;
};
