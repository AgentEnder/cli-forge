// ---
// id: conflicts-and-implications
// title: Conflicts and Implications
// description: |
//   This example illustrates how `.conflicts()` and `.implies()` can be used to enforce mutually exclusive options and mutually required options, respectively.
// commands:
//  - '{filename} --source=old --target=new'
//  - '{filename} --source=old --target=new --dry-run'
// ---
import cli from 'cli-forge';

cli('conflicts-and-implications', {
  builder: (args) =>
    args
      .option('source', {
        describe: 'Source database',
        type: 'string',
      })
      .option('target', {
        describe: 'Target database',
        type: 'string',
      })
      .option('dry-run', {
        describe: 'Simulate the migration without making changes',
        type: 'boolean',
      })
      .option('force', {
        describe: 'Force the migration even if there are warnings',
        type: 'boolean',
      })
      .option('backup', {
        describe: 'Where should the backup be stored',
        type: 'string',
      })
      // Conflicts creates mutually exclusive arguments. Validation will throw an error if both options are provided.
      // In this case, it makes sense that the user wouldn't want to both simulate and force a migration.
      .conflicts('dry-run', 'force')

      // Implies creates mutually required arguments. Validation will throw an error if the first argument is provided without the second.
      // Practically in this case, this means that if the user provides the --force option, they must also provide the --backup option.
      .implies('force', 'backup'),
  handler: (args) => {
    // ...
  },
}).forge();
