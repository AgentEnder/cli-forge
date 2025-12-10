import { makeComposableBuilder } from 'cli-forge';

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
