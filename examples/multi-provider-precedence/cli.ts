import { ConfigurationProviders, cli } from 'cli-forge';

(async () =>
  await cli('multi-provider', {
    builder: (args) =>
      args
        .option('name', { type: 'string' })
        .option('greeting', { type: 'string' })
        .option('farewell', { type: 'string' })
        // PackageJson registered first — its values take precedence on conflicts
        .config(ConfigurationProviders.PackageJson('my-app'))
        // JsonFile registered second — only non-conflicting values are used
        .config(ConfigurationProviders.JsonFile('app.config.json')),

    handler: (args) => {
      // name: "from-package" (PackageJson wins over JsonFile)
      // greeting: "json-greeting" (only in JsonFile)
      // farewell: "pkg-farewell" (only in PackageJson)
      console.log(`name: ${args.name}`);
      console.log(`greeting: ${args.greeting}`);
      console.log(`farewell: ${args.farewell}`);
    },
  }).forge())();
