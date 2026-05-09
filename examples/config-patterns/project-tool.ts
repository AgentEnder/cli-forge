import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// #region find-project-root
function findProjectRoot(from = process.cwd()): string {
  let dir = from;
  while (true) {
    if (
      existsSync(join(dir, 'package.json')) ||
      existsSync(join(dir, '.git'))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return from; // reached filesystem root, fall back to cwd
    dir = parent;
  }
}

const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('host', { type: 'string', default: 'localhost' })
      .option('port', { type: 'number', default: 3000 })
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.config.json',
        locations: {
          PROJECT: () => join(findProjectRoot(), 'my-tool.config.json'),
        },
        defaultLocation: 'PROJECT',
      }),
  handler: (args) => {
    console.log(`host: ${args.host}`);
    console.log(`port: ${args.port}`);
  },
});

(async () => await app.forge())();
// #endregion find-project-root
