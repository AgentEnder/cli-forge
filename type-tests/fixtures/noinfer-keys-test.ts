/**
 * Test if NoInfer affects keyof in mapped types
 */

type Props = {
  readonly server: { readonly type: 'object' };
  readonly database: { readonly type: 'object' };
};

// Keys without NoInfer
type KeysWithout = keyof Props;
const _keysWithout: KeysWithout = 'force error';

// Keys with NoInfer
type KeysWith = keyof NoInfer<Props>;
const _keysWith: KeysWith = 'force error';

// Mapped type without NoInfer
type MappedWithout = { [K in keyof Props]: K };
const _mappedWithout: MappedWithout = 'force error';

// Mapped type with NoInfer
type MappedWith = { [K in keyof NoInfer<Props>]: K };
const _mappedWith: MappedWith = 'force error';

// Full ResolveProperties simulation
type Simulated<T> = { [K in keyof T]: T[K] extends { type: 'object' } ? 'object found' : 'other' };

type SimWithout = Simulated<Props>;
const _simWithout: SimWithout = 'force error';

type SimWith = Simulated<NoInfer<Props>>;
const _simWith: SimWith = 'force error';
