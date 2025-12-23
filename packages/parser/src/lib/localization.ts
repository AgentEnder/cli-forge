/**
 * Localization dictionary type for translating option keys and other text.
 * Each key maps to an object with a "default" value and optional locale-specific translations.
 */
export type LocalizationDictionary = Record<
  string,
  {
    default: string;
    [locale: string]: string;
  }
>;

/**
 * Localization function type for custom translation logic.
 * This allows integration with existing localization libraries like i18next.
 */
export type LocalizationFunction = (key: string) => string;

/**
 * Detects the current locale from the system.
 * Uses Intl.DateTimeFormat to determine the user's locale.
 * @returns The detected locale string (e.g., "en-US", "es-ES")
 */
export function detectLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale;
}

/**
 * Resolves a localized text value from a dictionary.
 * @param key The key to look up in the dictionary
 * @param dictionary The localization dictionary
 * @param locale The target locale
 * @returns The localized text, or the original key if not found
 */
export function resolveLocalizedText(
  key: string,
  dictionary: LocalizationDictionary | undefined,
  locale: string | undefined
): string {
  if (!dictionary || !dictionary[key]) {
    return key;
  }

  const entry = dictionary[key];

  // If locale is specified and exists in the entry, use it
  if (locale && entry[locale]) {
    return entry[locale];
  }

  // Fall back to default
  return entry.default;
}
