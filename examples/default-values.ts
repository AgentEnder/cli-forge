// ---
// id: default-values
// title: Default Values
// description: |
//   This is a simple example that demonstrates the various ways you can set default values for options.
//
//   The default value can be set via the `default` property in an option definition. This can be done in three ways:
//   - Setting the `default` property to a value directly
//   - Setting the `default` property to an object containing function that returns a value and a description
//   - Setting the `default` property to an object containing a value and a description
//
//   Setting the `default` property to a value directly is the simplest way to set a default value, but can lead to some odd behavior if the value isn't consistent. For example, if the default value is the value of an environment variable that may differ among users then the actual default value will be different for each user. In this case in documentation, it would be better to tell users a description of the default value rather than the actual value.
//
// commands:
//  - '{filename}'
//  - '{filename} --name sir'
//  - '{filename} --greeting "Good day"'
//  - command: '{filename} --farewell "Goodbye"'
//    env:
//      DEFAULT_VALUES_HELLO: "Greetings"
// ---
import cliForge from 'cli-forge';

const cli = cliForge('default-values').command('$0', {
  builder: (args) =>
    args
      .option('name', {
        type: 'string',
        description: 'The name to say hello to',
        // Setting the default value directly
        default: 'World',
      })
      .option('greeting', {
        type: 'string',
        description: 'The greeting to use',
        // Setting the default value to an object containing a value and a description
        default: {
          // The value here may be different across command runs. In docs,
          // we want a consistent description of the default value.
          value: process.env['DEFAULT_VALUES_HELLO'] ?? 'Hello',
          description: 'The default greeting',
        },
      })
      .option('farewell', {
        type: 'string',
        description: 'The farewell to use',
        // Setting the default value to an object containing a function that returns a value and a description
        default: {
          // The value here may be different across command runs. In docs,
          // we want a consistent description of the default. Using a factory function
          // gives more flexibility compared to the value + description method above.
          factory: () => {
            if (process.arch === 'x64') {
              return 'Goodbye';
            } else {
              return 'Goodnight';
            }
          },
          description: 'The default farewell',
        },
      }),
  handler: (args) => {
    console.log(`${args.greeting}, ${args.name}!`);
    console.log(`${args.farewell}, ${args.name}!`);
  },
});

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
