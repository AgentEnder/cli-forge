import { Command, Options } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Console, Effect } from 'effect';

// @effect/cli models commands as Effect values with typed
// errors and dependency injection via layers.

const nameOpt = Options.text('name').pipe(
  Options.withDefault('World')
);

const hello = Command.make(
  'hello',
  { name: nameOpt, uppercase: Options.boolean('uppercase') },
  ({ name, uppercase }) => {
    const msg = `Hello, ${name}!`;
    return Console.log(uppercase ? msg.toUpperCase() : msg);
  }
);

const goodbye = Command.make(
  'goodbye',
  { name: nameOpt, formal: Options.boolean('formal') },
  ({ name, formal }) =>
    Console.log(formal ? `Farewell, ${name}.` : `Bye, ${name}!`)
);

const greet = Command.make('greet').pipe(
  Command.withSubcommands([hello, goodbye])
);

const app = Command.run(greet, {
  name: 'greet',
  version: '1.0.0',
});

app(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
