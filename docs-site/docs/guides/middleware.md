---
title: Middleware
description: Transform arguments and add context before command handlers run
nav:
  order: 4
---

# Middleware

Middleware lets you transform, validate, or enrich arguments before the command handler runs. Instead of cluttering your handler with setup logic, middleware keeps handlers focused on their core behavior while making cross-cutting concerns composable and reusable.

## Basic middleware

Register middleware with `.middleware()`. Each middleware receives the current args and can modify them or return new properties:

<%= example('middleware').region('cli') %>

Middleware registered on a parent command runs before the child command's middleware. This makes it ideal for logging, authentication checks, or any setup that applies across multiple commands.

## What middleware can do

Middleware functions receive the accumulated args object and can:

- **Mutate args in place** — e.g., normalizing a string to uppercase
- **Return new properties** — spread the existing args and add fields; TypeScript tracks the new type
- **Perform side effects** — log, check permissions, start timers
- **Run async work** — middleware can be `async` and will be awaited

## Composing middleware from modules

For larger CLIs, define middleware in separate files with explicit type signatures. This keeps each concern isolated and testable.

Start by defining the types each middleware contributes:

<%= example('middleware-composition').file('types.ts') %>

Then implement each middleware in its own module. Here's a timing middleware that adds a request ID and start time:

<%= example('middleware-composition').region('timing-middleware') %>

And an authentication middleware that adds user context:

<%= example('middleware-composition').region('auth-middleware') %>

Finally, compose them in your command definition:

<%= example('middleware-composition').region('command') %>

Each `.middleware()` call adds its return type to the args. By the time the handler runs, TypeScript knows args has `name`, `startTime`, `requestId`, `user`, and `authenticated` — all fully typed.

## Execution order and deduplication

Middleware follows two rules:

1. **Parent-first ordering** — middleware on a parent command runs before middleware on child commands.
2. **Run-once deduplication** — each middleware function runs exactly once per invocation, even if the same function is registered at multiple levels. CLI Forge tracks this by reference, so reusing the same function across commands is safe.

## When to use middleware vs. handler logic

| Use middleware when | Use handler logic when |
|---|---|
| The logic applies to multiple commands | The logic is specific to one command |
| You need to add typed properties to args | You are consuming args, not transforming them |
| You want to keep the handler focused | The setup is minimal (one line) |

For the full middleware composition example with test assertions, see the [middleware composition example](/examples/middleware-composition).
