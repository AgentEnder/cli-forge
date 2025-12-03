#!/usr/bin/env node

import { cli } from 'cli-forge';
import { assertCommand } from './commands/assert.js';
import { traceCommand } from './commands/trace.js';
import { compareCommand } from './commands/compare.js';

cli('type-debug', {
  description: 'TypeScript type debugging utilities for cli-forge',
})
  .command(traceCommand)
  .command('assert', assertCommand)
  .command(compareCommand)
  .forge()
  .catch((error: unknown) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
