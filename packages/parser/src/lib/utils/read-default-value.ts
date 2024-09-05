import {
  Default,
  OptionConfig,
  PlainDefaultValue,
  OptionConfigToType,
} from '../option-types';

export function readDefaultValue<const T extends OptionConfig>(
  option: T
): [OptionConfigToType<T> | undefined, string | undefined] {
  if (option.default !== undefined) {
    const declaredDefault = option.default as any as Default<T>;
    if (typeof declaredDefault === 'object') {
      if ('value' in declaredDefault) {
        const value = declaredDefault.value as any as OptionConfigToType<T>;
        return [value, declaredDefault.description];
      }
      if ('factory' in declaredDefault) {
        const factory =
          declaredDefault.factory as any as () => OptionConfigToType<T>;
        return [factory(), declaredDefault.description];
      }
    } else {
      return [declaredDefault, undefined];
    }
  }
  return [undefined, undefined];
}
