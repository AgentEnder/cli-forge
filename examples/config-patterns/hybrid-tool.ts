import { homedir } from 'os';
import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// #region hybrid
const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('theme', { type: 'string', default: 'light' })
      // Project config — checked first
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.config.json',
      })
      // User config — fallback, with a named USER location for init
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.json',
        locations: {
          USER: () => join(homedir(), '.config', 'my-tool', 'config.json'),
        },
        defaultLocation: 'USER',
      }),
  handler: (args) => {
    console.log(`theme: ${args.theme}`);
  },
});

(async () => await app.forge())();
// #endregion hybrid
