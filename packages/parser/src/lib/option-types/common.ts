export type PlainDefaultValue<T> = T;
export type DefaultValueWithDescription<T> = {
  value: PlainDefaultValue<T>;
  description: string;
};
export type DefaultValueWithFactory<T> = {
  factory: () => PlainDefaultValue<T>;
  description: string;
};

export type Default<T> =
  | PlainDefaultValue<T>
  | DefaultValueWithDescription<T>
  | DefaultValueWithFactory<T>;

export type CommonOptionConfig<T, TCoerce = T, TChoices = T[]> = {
  /**
   * If set to true, the option will be treated as a positional argument.
   */
  positional?: boolean;

  /**
   * Provide an array of aliases for the option.
   */
  alias?: string[];

  /**
   * Provide an array of choices for the option. Values not in the array will throw an error.
   */
  choices?: TChoices | (() => TChoices);

  /**
   * Provide a default value for the option.
   *
   * If the default value is a tuple, the first value will be used as the default value, and the second value will be used as the description.
   */
  default?: Default<T>;

  /**
   * Provide a description for the option.
   */
  description?: string;

  /**
   * Provide a function to coerce the value of the option.
   * @param value Value of the option
   * @returns Coerced value of the option
   */
  coerce?: (value: T) => TCoerce;

  /**
   * Provide a function to validate the value of the option.
   * @param value Coerced value of the option
   * @returns If the value is valid, return true. If the value is invalid, return false or a string with an error message.
   */
  validate?: (value: TCoerce) => boolean | string;

  /**
   * If true, the option is required.
   */
  required?: boolean;

  /**
   * If set, the option will be populated from the environment variable `${env}_${optionName}`.
   * If set to true, the environment variable will be `${optionName}`.
   * If explicitly set to false, environment variable population will be disabled for this option.
   */
  env?:
    | string
    | boolean
    | {
        /**
         * What key should the value be read from in process.env
         */
        key?: string;

        /**
         * If set to false, ignore prefix provided by .env() call.
         */
        prefix?: boolean;

        /**
         * If set to false, the option will not be set in process.env, even if the global env option is set to reflect.
         * If set to true, the option will be set in process.env, even if the global env option is set to ignore.
         */
        reflect?: boolean;

        /**
         * If set to false the option will not be read from process.env. This is useful if you
         * want to set the value in process.env, but not read it from there.
         *
         * @default true
         */
        populate?: boolean;
      };

  /**
   * If set, the option will be marked as deprecated, with the provided message. This will not effect runtime behavior,
   * but will be displayed in help output and generated docs.
   */
  deprecated?: string;

  /**
   * If true, the option will not be displayed in help output or generated docs.
   */
  hidden?: boolean;

  /**
   * Can be set to group options in help output and generated docs.
   */
  group?: string;
};
