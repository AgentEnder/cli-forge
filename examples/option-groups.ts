// ---
// id: option-groups
// title: Option Groups
// description: |
//   Options can be grouped together in the help output by using the `group` method. This will also affect generated documentation. The `sortOrder` parameter can be used to control the order in which groups are displayed. Lower values will be displayed first. If two groups have the same `sortOrder`, they will be sorted alphabetically.
//
//   Options can be placed in a group in one of 2 ways:
//   - An explicit call to `.group` as part of the command's builder function.
//   - By passing a `group` property in the option definition.
//
// commands:
//   - '{filename} --help'
// ---

import { cli } from 'cli-forge';

const myCLI = cli('demo', {
  builder: (args) =>
    args
      .option('firstName', {
        type: 'string',
        description: 'The name to say hello to',
      })
      .option('lastName', {
        type: 'string',
        description: 'The last name to say hello to',
      })
      .option('age', {
        type: 'number',
        description: 'The age of the person',
      })
      .option('street', {
        type: 'string',
        description: 'The street where the person lives',
        group: 'address',
      })
      .option('city', {
        type: 'string',
        description: 'The city where the person lives',
        group: 'address',
      })
      .group('basic-info', ['firstName', 'lastName', 'age']),
  handler: (args) => {
    // not important
  },
});

if (require.main === module) myCLI.forge();
