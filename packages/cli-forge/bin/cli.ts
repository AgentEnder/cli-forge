#!/usr/bin/env node

import { cli } from '../src';
import { withGenerateDocumentation } from './commands/generate-documentation';

const mycli = withGenerateDocumentation(cli('cli-forge'));

export default mycli;

mycli.forge();
