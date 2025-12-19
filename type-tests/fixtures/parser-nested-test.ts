/**
 * Test nested objects using parser() directly
 */
import { parser } from '@cli-forge/parser';

const result = parser()
  .option('config', {
    type: 'object',
    properties: {
      server: {
        type: 'object',
        properties: {
          host: { type: 'string', default: 'localhost' },
          port: { type: 'number', default: 3000 },
        },
      },
      name: { type: 'string' },
    },
    coerce: (val) => {
      // What is val typed as?
      return val;
    },
  })
  .parse([]);

// What is result.config typed as?
type ConfigType = typeof result.config;
//   ^?
