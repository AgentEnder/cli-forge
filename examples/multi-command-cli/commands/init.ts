import { makeComposableBuilder, chain } from 'cli-forge';

/**
 * Composable builder that adds the init command.
 * Returns an object with initialization details for programmatic access.
 */
export const withInitCommand = makeComposableBuilder((args) =>
  args.command('init', {
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
          choices: ['basic', 'typescript', 'react'] as const,
          default: 'basic' as const,
        })
        .option('git', {
          type: 'boolean',
          description: 'Initialize git repository',
          default: true,
        }),

    // Handler returns initialization info - useful for programmatic use
    handler: (args): { projectPath: string; template: string } => {
      console.log(`Initializing project: ${args.name}`);
      console.log(`  Template: ${args.template}`);
      console.log(`  Git: ${args.git ? 'yes' : 'no'}`);

      return {
        projectPath: `./${args.name}`,
        template: args.template,
      };
    },
  })
);
