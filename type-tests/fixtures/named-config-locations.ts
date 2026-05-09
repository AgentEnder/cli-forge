/**
 * Type-level tests for named configuration locations.
 *
 * Verifies:
 *   1. `.config(...)` accumulates location names into the CLI's
 *      `TConfigLocations` generic.
 *   2. Subsequent `.option(...)` calls constrain `defaultConfigLocation`
 *      to the accumulated names — typos fail at compile time.
 *   3. Multiple `.config()` calls compose location names as a union.
 *   4. `defaultLocation` itself is constrained to keys of the locations map.
 */
import { cli, ConfigurationFiles } from 'cli-forge';

// ── (1) Single .config() — TConfigLocations becomes 'USER' | 'PROJECT' ──
const single = cli('test').config(ConfigurationFiles.JsonFileConfigLoader, {
  filename: 'test.json',
  locations: {
    USER: '/user/.test.json',
    PROJECT: '/project/.test.json',
  },
  defaultLocation: 'PROJECT',
});

// (2a) Valid name — compiles
single.option('theme', {
  type: 'string',
  defaultConfigLocation: 'USER',
});
single.option('port', {
  type: 'number',
  defaultConfigLocation: 'PROJECT',
});

// (2b) Typo — must fail at compile time
single.option('bad', {
  type: 'string',
  // @ts-expect-error: 'TYPO' is not a registered location name
  defaultConfigLocation: 'TYPO',
});

// (4) Invalid defaultLocation — must fail at compile time
cli('typo-default').config(ConfigurationFiles.JsonFileConfigLoader, {
  filename: 'test.json',
  locations: { USER: '/u' },
  // @ts-expect-error: 'NOPE' is not a key of locations
  defaultLocation: 'NOPE',
});

// ── (3) Two .config() calls accumulate names ──
const dual = cli('dual')
  .config(ConfigurationFiles.JsonFileConfigLoader, {
    filename: 'a.json',
    locations: { USER: '/u' },
    defaultLocation: 'USER',
  })
  .config(ConfigurationFiles.JsonFileConfigLoader, {
    filename: 'b.json',
    locations: { PROJECT: '/p' },
    defaultLocation: 'PROJECT',
  });

// Both names visible after two registrations
dual.option('a', { type: 'string', defaultConfigLocation: 'USER' });
dual.option('b', { type: 'string', defaultConfigLocation: 'PROJECT' });
// @ts-expect-error: third name not registered
dual.option('c', { type: 'string', defaultConfigLocation: 'OTHER' });

// ── No .config() with locations → defaultConfigLocation rejects all strings ──
const empty = cli('empty');
empty.option('whatever', {
  type: 'string',
  // @ts-expect-error: no locations registered → TConfigLocations = never
  defaultConfigLocation: 'USER',
});
