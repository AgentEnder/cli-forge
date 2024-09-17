import { ConfigurationProviders, cli } from 'cli-forge';

(async () =>
  await cli('configured-cli', {
    builder: (args) =>
      args
        .option('name', { type: 'string' })
        .option('greeting', { type: 'string' })
        .option('farewell', { type: 'string' })

        // Allows loading configuration values from the 'configured-cli' entry in package.json.
        .config(ConfigurationProviders.PackageJson('configured-cli'))

        // Allows loading configuration values from the root of 'configured-cli.config.json'.
        .config(ConfigurationProviders.JsonFile('configured-cli.config.json'))

        // Allows loading configuration values from the 'configured-cli' entry in 'other.config.json'.
        .config(
          ConfigurationProviders.JsonFile('other.config.json', 'configured-cli')
        ),

    handler: (args) => {
      console.log(`${args.greeting}, ${args.name}!`);
      console.log(`${args.farewell}, ${args.name}!`);
    },
  }).forge())();
