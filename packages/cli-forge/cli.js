#!/usr/bin/env node

const cli = require('./dist/bin/cli.cjs');

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
