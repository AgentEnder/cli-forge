import { ResolveProperties, BaseType, ResolveOptionType } from '@cli-forge/parser';

// Test nested object resolution
type NestedProps = {
  server: {
    type: 'object';
    properties: {
      host: { type: 'string'; default: 'localhost' };
      port: { type: 'number'; default: 3000 };
    };
  };
  name: { type: 'string' };
};

type TestResolve = ResolveProperties<NestedProps>;
//   ^?

type TestServer = BaseType<NestedProps['server']>;
//   ^?

type TestServerResolved = ResolveOptionType<NestedProps['server']>;
//   ^?
