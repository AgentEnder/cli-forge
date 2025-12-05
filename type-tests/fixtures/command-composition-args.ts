import { cli } from 'cli-forge';

// Test that command composition can pass args to sibling handlers
// This reproduces the command-composition.ts issue

const dbCli = cli('db')
  .option('verbose', { type: 'boolean' })
  .command('empty', {
    builder: (p) => p.option('force', { type: 'boolean' }),
    handler: (args) => {
      // Handler expects { verbose?: boolean, force?: boolean }
    }
  })
  .command('migrate', {
    builder: (p) => p.option('target', { type: 'string' }),
    handler: (args) => {
      // Handler expects { verbose?: boolean, target?: string }
    }
  })
  .command('reset', {
    handler: async (args, ctx) => {
      const siblings = ctx.getParentCommand().getChildCommands();
      
      // This should work - passing parent args to sibling handler
      // The args should be compatible since verbose is inherited
      await siblings.empty.getHandler()?.(args); // Currently fails type check
      await siblings.migrate.getHandler()?.(args); // Currently fails type check
    }
  });

export { dbCli };
