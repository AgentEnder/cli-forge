// ---
// id: i18next-integration
// title: i18next Integration
// description: |
//   Demonstrates how to integrate cli-forge with i18next localization library
//   using the function-based localization API.
// commands:
//   - command: '{filename} --name TestApp --port 8080'
//     assertions:
//       - contains: 'Starting server'
//       - contains: 'Name: TestApp'
//       - contains: 'Port: 8080'
//   - command: '{filename} --help'
//     assertions:
//       - contains: '--name'
//       - contains: '--port'
// ---

import { cli } from 'cli-forge';

// Mock i18next-like localization function
// In a real application, you would import i18next and use i18next.t()
function createLocalizer(locale: string) {
  const translations: Record<string, Record<string, string>> = {
    'en-US': {
      name: 'name',
      port: 'port',
      verbose: 'verbose',
      serve: 'serve',
      build: 'build',
    },
    'es-ES': {
      name: 'nombre',
      port: 'puerto',
      verbose: 'detallado',
      serve: 'servir',
      build: 'construir',
    },
    'fr-FR': {
      name: 'nom',
      port: 'port',
      verbose: 'verbeux',
      serve: 'servir',
      build: 'construire',
    },
  };

  return (key: string): string => {
    return translations[locale]?.[key] || key;
  };
}

// In a real application with i18next:
// import i18next from 'i18next';
// 
// await i18next.init({
//   lng: 'es-ES',
//   resources: {
//     'es-ES': {
//       translation: {
//         name: 'nombre',
//         port: 'puerto',
//         verbose: 'detallado',
//       }
//     }
//   }
// });

// Use the current system locale, or you could use i18next.language
const locale = Intl.DateTimeFormat().resolvedOptions().locale;
const t = createLocalizer(locale);

// With real i18next, you would use:
// cli('server-app').localize((key) => i18next.t(key))

cli('server-app')
  // Pass the localization function - works with any i18n library
  .localize(t)
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
