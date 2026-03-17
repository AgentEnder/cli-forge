## Command Files

Each command lives in its own file under `commands/`. This separation makes commands easier to test in isolation and keeps the codebase organized as it grows.

### Init Command

The init command creates a new project. It uses choices for the template option, which TypeScript narrows to a literal union type.

<%= file('commands/init.ts') %>

### Build Command

The build command handles production builds with options for minification and source maps.

<%= file('commands/build.ts') %>

### Serve Command

The serve command starts a development server with configurable port and host.

<%= file('commands/serve.ts') %>

## Main Entry Point

The main CLI file imports and registers all commands. This keeps the entry point minimal and focused on composition.

<%= file('cli.ts') %>

## Directory Structure

```
multi-command-cli/
  cli.ts              # Entry point, registers commands
  commands/
    init.ts           # Initialize project
    build.ts          # Build for production
    serve.ts          # Development server
```

This structure is common in production CLIs. Each command can be developed and tested independently, and new commands are added by creating a new file and registering it in the main CLI.
