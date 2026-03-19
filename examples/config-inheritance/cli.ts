import { ConfigurationProviders, cli } from 'cli-forge';

(async () =>
  await cli('config-inheritance', {
    builder: (args) =>
      args
        .option('name', { type: 'string' })
        .option('greeting', { type: 'string' })
        .option('farewell', { type: 'string' })
        .config(ConfigurationProviders.JsonFile('app.config.json')),

    handler: (args) => {
      // name and greeting come from app.config.json (overrides base)
      // farewell comes from base.config.json (inherited via extends)
      console.log(`name: ${args.name}`);
      console.log(`greeting: ${args.greeting}`);
      console.log(`farewell: ${args.farewell}`);
    },
  }).forge())();
