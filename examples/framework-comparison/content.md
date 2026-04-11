Each file below implements the same CLI: a `greet` command with `hello` and `goodbye`
subcommands, string options, and boolean flags. Compare how each framework handles
subcommand registration, option definition, and handler execution.

## CLI Forge

Uses a fluent builder with full TypeScript inference — each `.option()` call
expands the handler's type.

<%= file('cli-forge.ts') %>

## yargs

Similar fluent builder API. Type inference relies on `@types/yargs`; complex CLIs
often need manual interfaces.

<%= file('yargs.ts') %>

## commander

String-based option definitions (`'--name <string>'`). Type-safe options require
the separate `@commander-js/extra-typings` package.

<%= file('commander.ts') %>

## oclif

Class-based commands with static flag declarations. In a real project, each command
lives in its own file and is auto-discovered from the directory structure.

<%= file('oclif.ts') %>

## clipanion

Class-based commands compiled into a state machine. Powered by decorators
and the typanion validation library.

<%= file('clipanion.ts') %>

## cac

Lightweight fluent builder. Options are parsed at runtime with no compile-time
type inference.

<%= file('cac.ts') %>

## meow

Minimal single-function parser. Subcommands are positional arguments handled
manually with `if`/`else`.

<%= file('meow.ts') %>

## citty

Declarative command definitions from the UnJS ecosystem, built on Node.js
`util.parseArgs`.

<%= file('citty.ts') %>

## cleye

Declarative CLI builder with TypeScript command narrowing — checking
`argv.command` narrows the available flags.

<%= file('cleye.ts') %>

## @effect/cli

Commands are Effect values with typed errors and dependency injection. Requires
the full Effect ecosystem.

<%= file('effect-cli.ts') %>

## Node.js util.parseArgs

Built-in parser with no subcommand concept. Everything beyond basic
string/boolean parsing is manual.

<%= file('parseargs.ts') %>
