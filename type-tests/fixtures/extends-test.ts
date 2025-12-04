/**
 * Test if extends { default: unknown } matches incorrectly
 */

// Config without top-level default
type ConfigNoDefault = {
  readonly type: 'object';
  readonly properties: {
    readonly host: { readonly type: 'string'; readonly default: 'localhost' };
  };
};

// Does this extend { default: unknown }?
type HasDefault = ConfigNoDefault extends { default: unknown } ? 'yes' : 'no';

// Force error to see the result
const _hasDefault: HasDefault = 'force error';

// Also test without readonly
type ConfigNoDefaultMutable = {
  type: 'object';
  properties: {
    host: { type: 'string'; default: 'localhost' };
  };
};

type HasDefaultMutable = ConfigNoDefaultMutable extends { default: unknown } ? 'yes' : 'no';

const _hasDefaultMutable: HasDefaultMutable = 'force error';

// Test with actual top-level default
type ConfigWithDefault = {
  readonly type: 'object';
  readonly default: { host: 'localhost' };
};

type HasDefaultActual = ConfigWithDefault extends { default: unknown } ? 'yes' : 'no';

const _hasDefaultActual: HasDefaultActual = 'force error';
