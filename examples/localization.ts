// ---
// id: localization-example
// title: Localization Support
// description: |
//   Demonstrates how to use the localization feature to support
//   multiple languages for option keys and command names.
// test:
//   - name: "Accepts localized option names"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json localization.ts --nombre Juan --puerto 8080'
//     assertions:
//       stdout:
//         matches: 'Starting server.*Name: Juan.*Port: 8080'
//   - name: "Accepts default option names"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json localization.ts --name John --port 3000'
//     assertions:
//       stdout:
//         matches: 'Starting server.*Name: John.*Port: 3000'
//   - name: "Shows localized options in help"
//     options:
//       command: 'npx tsx --no-cache --tsconfig ./tsconfig.json localization.ts --help'
//     assertions:
//       stdout:
//         matches: '--nombre.*--puerto'
// ---

import { cli, LocalizationDictionary } from 'cli-forge';

// Define localization dictionary
const dictionary: LocalizationDictionary = {
  name: {
    default: 'name',
    'es-ES': 'nombre',
    'fr-FR': 'nom',
  },
  port: {
    default: 'port',
    'es-ES': 'puerto',
    'fr-FR': 'port',
  },
  verbose: {
    default: 'verbose',
    'es-ES': 'detallado',
    'fr-FR': 'verbeux',
  },
};

cli('server-app')
  // Set up localization (uses Spanish for this example)
  .localize(dictionary, 'es-ES')
  // Register options - they will accept both default and localized keys
  .option('name', {
    type: 'string',
    description: 'Server name',
    default: 'MyServer',
  })
  .option('port', {
    type: 'number',
    description: 'Port to listen on',
    default: 8080,
  })
  .option('verbose', {
    type: 'boolean',
    description: 'Enable verbose logging',
    alias: ['v'],
  })
  .command('$0', {
    handler: (args) => {
      console.log('Starting server...');
      console.log(`Name: ${args.name}`);
      console.log(`Port: ${args.port}`);
      if (args.verbose) {
        console.log('Verbose logging enabled');
      }
    },
  })
  .forge();
