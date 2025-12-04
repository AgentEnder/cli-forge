/**
 * Minimal reproduction of the contextual typing issue
 */

// Simplified type that mirrors the structure
type SimpleObjectConfig<TProps extends Record<string, { type: string }>> = {
  type: 'object';
  properties: TProps;
  coerce?: (value: { [K in keyof TProps]: string }) => unknown;
};

type SimpleStringConfig = {
  type: 'string';
  coerce?: (value: string) => unknown;
};

type SimpleConfig<TProps extends Record<string, { type: string }> = Record<string, any>> =
  | SimpleStringConfig
  | SimpleObjectConfig<TProps>;

// Function that accepts the config
function processConfig<const TConfig extends SimpleConfig>(config: TConfig): void {}

// Test 1: Object config inline - does coerce get typed correctly?
processConfig({
  type: 'object',
  properties: {
    foo: { type: 'string' },
  },
  coerce: (val) => {
    // What is val?
    return val;
  },
});

// Test 2: String config inline
processConfig({
  type: 'string',
  coerce: (val) => {
    // What is val?
    return val;
  },
});

// Test 3: What if we remove the union?
function processObjectConfig<const TProps extends Record<string, { type: string }>>(
  config: SimpleObjectConfig<TProps>
): void {}

processObjectConfig({
  type: 'object',
  properties: {
    foo: { type: 'string' },
  },
  coerce: (val) => {
    // What is val?
    return val;
  },
});
