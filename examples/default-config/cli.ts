import { join } from 'path';
import { ConfigurationFiles, cli } from 'cli-forge';

// #region init-command
const app = cli('my-tool', {
  builder: (args) =>
    args
      .option('theme', { type: 'string', default: 'light' })
      .option('lang', { type: 'string', default: 'en' })
      // The `default` option tells the framework where to create the config file
      // when no existing config is found on disk.
      .config(ConfigurationFiles.JsonFileConfigLoader, {
        filename: 'my-tool.config.json',
        default: () => join(process.cwd(), 'my-tool.config.json'),
      }),

  handler: (args) => {
    console.log(`theme: ${args.theme}`);
    console.log(`lang: ${args.lang}`);
  },
});

app
  .command('init', {
    description: 'Initialize configuration file with current settings',
    handler: async (args) => {
      await app.updateConfig({ theme: args.theme, lang: args.lang });
      console.log('Config written to my-tool.config.json');
    },
  })
  .command('set', {
    builder: (cmd) =>
      cmd
        .option('key', { type: 'string', required: true })
        .option('value', { type: 'string', required: true }),
    description: 'Update a single config value',
    handler: async (args) => {
      await app.updateConfig({
        [args.key]: args.value,
      } as Partial<{ theme: string; lang: string }>);
      console.log(`Set ${args.key} = ${args.value}`);
    },
  });

(async () => await app.forge())();
// #endregion init-command
