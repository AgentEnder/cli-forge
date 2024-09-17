// ---
// id: arguments-of
// title: Arguments Of
// description: |
//   When building a CLI, and especially if taking advantage of [composition](./composable-options), it can be necessary to have a typescript type that respresents the resolved arguments of a CLI command. For example, if you abstract the handler of a command into a separate function, the argument of that function would be typed as the arguments of the CLI command.
//
//   CLI Forge provides the `ArgumentsOf` type to help with this. It takes a CLI instance or a function that returns a CLI instance and returns the type of the arguments that the CLI command handler will receive. There are some difficulties with typescript support for circular references, so its usage isn't perfect, but if used with composable builders directly you avoid these problems.
// commands:
//  - '{filename} --name John --age 42'
// ---
import { cli, ArgumentsOf, makeComposableBuilder, chain, CLI } from 'cli-forge';

const withName = makeComposableBuilder((args) =>
  args.option('name', {
    type: 'string',
    description: 'Your name',
    required: true,
  })
);

const withAge = makeComposableBuilder((args) =>
  args.option('age', {
    type: 'number',
    description: 'Your age',
    required: true,
  })
);

const builder = <T extends CLI>(args: T) => chain(args, withName, withAge);

const myCLI = cli('arguments-of', {
  builder: (args) => builder(args),
  handler: (args) => CLIHandler(args),
});

type Arguments = ArgumentsOf<typeof builder>;

function CLIHandler(args: Arguments) {
  console.log(`Hello, ${args.name}!`);
  console.log(`You are ${args.age.toFixed(0)} years old.`);
}

if (require.main === module) {
  (async () => {
    await myCLI.forge();
  })();
}
