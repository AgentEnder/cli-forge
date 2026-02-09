import { ConfigurationProviders, cli } from 'cli-forge';

(async () =>
  await cli('circular-test', {
    builder: (args) =>
      args
        .option('name', { type: 'string' })
        .option('greeting', { type: 'string' })
        .config(ConfigurationProviders.JsonFile('a.config.json')),

    handler: (args) => {
      console.log(`${args.greeting}, ${args.name}!`);
    },
  }).forge())();
