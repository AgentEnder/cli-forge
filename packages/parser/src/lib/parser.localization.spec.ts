import { describe, it, expect } from 'vitest';
import { parser, LocalizationDictionary } from './parser';

describe('parser localization', () => {
  const dictionary: LocalizationDictionary = {
    name: {
      default: 'name',
      'es-ES': 'nombre',
    },
    port: {
      default: 'port',
      'es-ES': 'puerto',
    },
    verbose: {
      default: 'verbose',
      'es-ES': 'detallado',
    },
  };

  it('should parse using localized keys', () => {
    const p = parser()
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' });

    const result = p.parse(['--nombre', 'test', '--puerto', '8080']);
    expect(result.name).toBe('test');
    expect(result.port).toBe(8080);
  });

  it('should still accept default keys as aliases', () => {
    const p = parser()
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' });

    const result = p.parse(['--name', 'test', '--port', '8080']);
    expect(result.name).toBe('test');
    expect(result.port).toBe(8080);
  });

  it('should work with short flags', () => {
    const p = parser()
      .localize(dictionary, 'es-ES')
      .option('verbose', { type: 'boolean', alias: ['v'] });

    const result1 = p.parse(['--detallado']);
    expect(result1.verbose).toBe(true);

    const result2 = p.parse(['-v']);
    expect(result2.verbose).toBe(true);
  });

  it('should work without localization', () => {
    const p = parser()
      .option('name', { type: 'string' })
      .option('port', { type: 'number' });

    const result = p.parse(['--name', 'test', '--port', '8080']);
    expect(result.name).toBe('test');
    expect(result.port).toBe(8080);
  });

  it('should use default locale if not specified', () => {
    const p = parser()
      .localize(dictionary)
      .option('name', { type: 'string' });

    // Just verify it doesn't crash - actual locale depends on system
    const result = p.parse(['--name', 'test']);
    expect(result.name).toBe('test');
  });

  it('should return localized display key', () => {
    const p = parser()
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' })
      .option('port', { type: 'number' });

    expect(p.getDisplayKey('name')).toBe('nombre');
    expect(p.getDisplayKey('port')).toBe('puerto');
    expect(p.getDisplayKey('unknown')).toBe('unknown');
  });

  it('should preserve localization in cloned parser', () => {
    const p1 = parser()
      .localize(dictionary, 'es-ES')
      .option('name', { type: 'string' });

    const p2 = p1.clone();

    expect(p2.getDisplayKey('name')).toBe('nombre');
    const result = p2.parse(['--nombre', 'test']);
    expect(result.name).toBe('test');
  });

  it('should work with positional arguments', () => {
    const p = parser()
      .localize(dictionary, 'es-ES')
      .positional('name', { type: 'string' });

    const result = p.parse(['test']);
    expect(result.name).toBe('test');
  });

  it('should work with localization function', () => {
    const localizer = (key: string) => {
      const translations: Record<string, string> = {
        name: 'nombre',
        port: 'puerto',
      };
      return translations[key] || key;
    };

    const p = parser()
      .localize(localizer)
      .option('name', { type: 'string' })
      .option('port', { type: 'number' });

    // Should accept localized keys
    const result1 = p.parse(['--nombre', 'test', '--puerto', '8080']);
    expect(result1.name).toBe('test');
    expect(result1.port).toBe(8080);

    // Should also accept default keys
    const result2 = p.parse(['--name', 'test2', '--port', '9000']);
    expect(result2.name).toBe('test2');
    expect(result2.port).toBe(9000);
  });

  it('should display localized keys from function', () => {
    const localizer = (key: string) => {
      const translations: Record<string, string> = {
        name: 'nombre',
        port: 'puerto',
      };
      return translations[key] || key;
    };

    const p = parser()
      .localize(localizer)
      .option('name', { type: 'string' });

    expect(p.getDisplayKey('name')).toBe('nombre');
    expect(p.getDisplayKey('unknown')).toBe('unknown');
  });
});
