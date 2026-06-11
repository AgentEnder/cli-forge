import { homedir } from 'os';
import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// #region user-level
const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('theme', { type: 'string', default: 'light' })
      .option('lang', { type: 'string', default: 'en' })
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.json',
        default: () => join(homedir(), '.config', 'my-tool', 'config.json'),
      }),
  handler: (args) => {
    console.log(`theme: ${args.theme}`);
    console.log(`lang: ${args.lang}`);
  },
});

(async () => await app.forge())();
// #endregion user-level
