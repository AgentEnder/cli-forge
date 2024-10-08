#!/usr/bin/env node

import { cli } from '../src';
import { generateDocumentationCommand } from './commands/generate-documentation';
import { initCommand } from './commands/init';

const mycli = cli('cli-forge', {
  description: "CLI tool for working with cli-forge based CLI's.",
}).commands(generateDocumentationCommand, initCommand);

export default mycli;

if (require.main === module) {
  (async () => {
    await mycli.forge();
  })();
}
