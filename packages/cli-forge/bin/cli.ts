#!/usr/bin/env node

import { cli } from '../src';
import { withGenerateDocumentation } from './commands/generate-documentation';
import { withInit } from './commands/init';

const mycli = withInit(withGenerateDocumentation(cli('cli-forge')));

export default mycli;

mycli.forge();
