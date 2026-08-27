/**
 * An alias for an option. Aliases and short flags are one mechanism: a
 * single-character alias is the short flag, and there is no separate short-flag
 * concept.
 *
 * The length of the alias decides how it can be typed:
 *
 * - **One character** — usable with a single dash (`-f`) and groupable, so
 *   `-fb` means `-f -b`.
 * - **Two or more characters** — long-form only (`--force`). A single dash is
 *   read as a group of one-character aliases, so `-force` means
 *   `-f -o -r -c -e`. Help output follows the same convention and renders any
 *   alias longer than one character with two dashes.
 *
 * The first option in a group that takes a value ends the group: the rest of
 * that token is its value, as GNU tools read short flags. So `-fnvalue`,
 * `-fn=value` and `-fn value` all bind `value` to `n`. Nothing after that
 * option is read as a flag, whatever the characters happen to alias elsewhere,
 * so `-nf value` binds the literal `f` to `n` and leaves `value` over. Put
 * value-taking options last; array options end a group the same way.
 *
 * A character that resolves to nothing is reported on its own: `-fx` with only
 * `f` declared applies `f` and leaves `-x` unmatched. The exception is a group
 * where no character resolves, which stays unmatched as one token.
 *
 * Beware of declaring a multi-character alias whose characters are also
 * single-character aliases on the same command: `--prc` typed as `-prc` will
 * resolve as `-p -r -c` rather than as a typo.
 */
export type AliasConfig = {
  /**
   * The alias name (without any leading dashes).
   */
  name: string;
  /**
   * When true, this alias is functional when parsing but is omitted from help
   * output and generated documentation. Defaults to false.
   */
  hidden?: boolean;
};

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
   * Provide an array of aliases for the option. See {@link AliasConfig} for how
   * alias length decides between short-flag (`-f`) and long-form (`--force`)
   * spelling, and for how short-flag groups such as `-fb` are resolved.
   *
   * Each entry may be a string, or an object with `{ name, hidden }`. When
   * `hidden: true` is set, the alias still works when parsing arguments but
   * will not be displayed in help output or generated documentation.
   */
  alias?: Array<string | AliasConfig>;

  /**
   * Provide an array of choices for the option. Values not in the array will throw an error.
   */
  choices?: TChoices | (() => TChoices);

  /**
   * Provide a default value for the option.
   *
   * If the default value is a tuple, the first value will be used as the default value, and the second value will be used as the description.
   */
  default?: Default<NoInfer<T>>;

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
