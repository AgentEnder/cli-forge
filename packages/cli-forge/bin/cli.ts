#!/usr/bin/env node

import { cli } from '../src';
import { generateDocumentationCommand } from './commands/generate-documentation';
import { initCommand } from './commands/init';

const mycli = cli('cli-forge').commands(
  generateDocumentationCommand,
  initCommand
);

export default mycli;

mycli.forge();
