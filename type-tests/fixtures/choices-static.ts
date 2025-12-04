/**
 * Tests that static array choices narrow to literal union type.
 */
import { cli } from 'cli-forge';

// Choices defined as const for literal type inference
const formats = ['json', 'yaml', 'xml'] as const;
const levels = ['debug', 'info', 'warn', 'error'] as const;

const app = cli('test')
  .option('format', {
    type: 'string',
    choices: formats,
    required: true,
  })
  .option('level', {
    type: 'string',
    choices: levels,
    default: 'info' as const,
  })
  .command('run', {
    handler: (args) => {
      // format should be 'json' | 'yaml' | 'xml', not string
      const format: 'json' | 'yaml' | 'xml' = args.format;

      // level should be 'debug' | 'info' | 'warn' | 'error'
      const level: 'debug' | 'info' | 'warn' | 'error' = args.level;

      console.log(format, level);
    },
  });

export { app, formats, levels };
