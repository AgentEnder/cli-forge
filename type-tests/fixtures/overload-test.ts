/**
 * Test if function overloads fix the contextual typing issue
 */

// Types
type SimpleObjectConfig<TProps extends Record<string, { type: string }>> = {
  type: 'object';
  properties: TProps;
  coerce?: (value: { [K in keyof TProps]: string }) => unknown;
};

type SimpleStringConfig = {
  type: 'string';
  coerce?: (value: string) => unknown;
};

type SimpleNumberConfig = {
  type: 'number';
  coerce?: (value: number) => unknown;
};

// Overloaded function
function processConfig<const TProps extends Record<string, { type: string }>>(
  config: SimpleObjectConfig<TProps>
): void;
function processConfig(config: SimpleStringConfig): void;
function processConfig(config: SimpleNumberConfig): void;
function processConfig(config: unknown): void {
  // implementation
}

// Test 1: Object config with overload
processConfig({
  type: 'object',
  properties: {
    foo: { type: 'string' },
  },
  coerce: (val) => {
    // What is val now?
    return val;
  },
});

// Test 2: String config with overload
processConfig({
  type: 'string',
  coerce: (val) => {
    return val;
  },
});

// Test 3: Number config with overload
processConfig({
  type: 'number',
  coerce: (val) => {
    return val;
  },
});
