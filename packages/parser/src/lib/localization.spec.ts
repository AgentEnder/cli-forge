import { describe, it, expect } from 'vitest';
import {
  LocalizationDictionary,
  detectLocale,
  resolveLocalizedText,
} from './localization';

describe('localization', () => {
  describe('detectLocale', () => {
    it('should return a locale string', () => {
      const locale = detectLocale();
      expect(typeof locale).toBe('string');
      expect(locale.length).toBeGreaterThan(0);
    });
  });

  describe('resolveLocalizedText', () => {
    const dictionary: LocalizationDictionary = {
      name: {
        default: 'name',
        'es-ES': 'nombre',
        'fr-FR': 'nom',
      },
      port: {
        default: 'port',
        'es-ES': 'puerto',
      },
    };

    it('should return the localized text for the specified locale', () => {
      expect(resolveLocalizedText('name', dictionary, 'es-ES')).toBe('nombre');
      expect(resolveLocalizedText('name', dictionary, 'fr-FR')).toBe('nom');
      expect(resolveLocalizedText('port', dictionary, 'es-ES')).toBe('puerto');
    });

    it('should fall back to default if locale not found', () => {
      expect(resolveLocalizedText('name', dictionary, 'de-DE')).toBe('name');
      expect(resolveLocalizedText('port', dictionary, 'fr-FR')).toBe('port');
    });

    it('should return the key if not in dictionary', () => {
      expect(resolveLocalizedText('unknown', dictionary, 'es-ES')).toBe(
        'unknown'
      );
    });

    it('should return the key if dictionary is undefined', () => {
      expect(resolveLocalizedText('name', undefined, 'es-ES')).toBe('name');
    });

    it('should return the key if locale is undefined', () => {
      expect(resolveLocalizedText('name', dictionary, undefined)).toBe('name');
    });
  });
});
