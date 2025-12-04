import type { CLI } from 'cli-forge';

/**
 * Register the init command on the given CLI instance.
 * This pattern allows commands to be imported and registered modularly.
 */
export function registerInitCommand<T extends CLI>(cli: T) {
  return cli.command('init', {
    description: 'Initialize a new project',
    builder: (cmd) =>
      cmd
        .option('name', {
          type: 'string',
          description: 'Project name',
          required: true,
        })
        .option('template', {
          type: 'string',
          description: 'Template to use',
          choices: ['basic', 'typescript', 'react'],
          default: 'basic',
        })
        .option('git', {
          type: 'boolean',
          description: 'Initialize git repository',
          default: true,
        }),

    handler: (args) => {
      console.log(`Initializing project: ${args.name}`);
      console.log(`  Template: ${args.template}`);
      console.log(`  Git: ${args.git ? 'yes' : 'no'}`);
    },
  });
}
