// ---
// id: i18next-integration
// title: i18next Integration
// description: |
//   Demonstrates how to integrate cli-forge with i18next localization library
//   using the function-based localization API.
// test:
//   - name: "Runs with localized options"
//     options:
//       command: 'tsx --no-cache --tsconfig ./examples/tsconfig.json {entryPoint} --name TestApp --port 8080'
//     assertions:
//       stdout:
//         matches: 'Starting server.*Name: TestApp.*Port: 8080'
//   - name: "Shows help with localized option names"
//     options:
//       command: 'tsx --no-cache --tsconfig ./examples/tsconfig.json {entryPoint} --help'
//     assertions:
//       stdout:
//         matches: '--name.*--port'
// ---

import { cli } from 'cli-forge';
import i18next from 'i18next';

async function main() {
  // Initialize i18next with translations for multiple locales
  await i18next.init({
    lng: 'en-US', // Set default language
    fallbackLng: 'en-US',
    resources: {
      'en-US': {
        translation: {
          name: 'name',
          port: 'port',
          verbose: 'verbose',
          serve: 'serve',
          build: 'build',
        },
      },
      'es-ES': {
        translation: {
          name: 'nombre',
          port: 'puerto',
          verbose: 'detallado',
          serve: 'servir',
          build: 'construir',
        },
      },
      'fr-FR': {
        translation: {
          name: 'nom',
          port: 'port',
          verbose: 'verbeux',
          serve: 'servir',
          build: 'construire',
        },
      },
    },
  });

  // You can change the language dynamically:
  // await i18next.changeLanguage('es-ES');

  await cli('server-app')
    // Pass i18next.t as the localization function
    // This integrates cli-forge with i18next's translation system
    .localize((key) => i18next.t(key))
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
    .command('serve', {
      builder: (cmd) => cmd,
      handler: (args) => {
        console.log('Starting server...');
        console.log(`Name: ${args.name}`);
        console.log(`Port: ${args.port}`);
        if (args.verbose) {
          console.log('Verbose logging enabled');
        }
      },
      description: 'Start the development server',
    })
    .command('build', {
      builder: (cmd) => cmd,
      handler: (args) => {
        console.log('Building application...');
        console.log(`Name: ${args.name}`);
        if (args.verbose) {
          console.log('Verbose logging enabled');
        }
      },
      description: 'Build for production',
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
}

main();
