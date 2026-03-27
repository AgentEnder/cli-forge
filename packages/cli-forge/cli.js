#!/usr/bin/env node

const { default: cli } = require('./dist/bin/cli.cjs');

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
