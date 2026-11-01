import { ConfigurationProviders, cli } from 'cli-forge';

// #region providers
(async () =>
  await cli('configured-cli', {
    builder: (args) =>
      args
        .option('name', { type: 'string' })
        .option('greeting', { type: 'string' })
        .option('farewell', { type: 'string' })

        // #region package-json-config
        // Allows loading configuration values from the 'configured-cli' entry in package.json.
        .config(ConfigurationProviders.PackageJson('configured-cli'))
        // #endregion package-json-config

        // #region json-file-config
        // Allows loading configuration values from the root of 'configured-cli.config.json'.
        .config(ConfigurationProviders.JsonFile('configured-cli.config.json'))
        // #endregion json-file-config

        // #region nested-key-config
        // Allows loading configuration values from the 'configured-cli' entry in 'other.config.json'.
        .config(
          ConfigurationProviders.JsonFile('other.config.json', 'configured-cli')
        ),
        // #endregion nested-key-config

    handler: (args) => {
      console.log(`${args.greeting}, ${args.name}!`);
      console.log(`${args.farewell}, ${args.name}!`);
    },
  }).forge())();
// #endregion providers
