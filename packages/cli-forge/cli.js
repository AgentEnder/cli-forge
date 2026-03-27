#!/usr/bin/env node

const { default: cli } = require('./dist/bin/cli.js');

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
