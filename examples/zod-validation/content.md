## Deployment Schema

Define a schema for deployment configuration. The schema validates input and transforms it to add computed properties like `requiresApproval` based on the environment.

<%= file('schemas/config.ts') %>

## User Schema

The user schema validates email format and normalizes it to lowercase. It also computes permission flags based on the user's role.

<%= file('schemas/user.ts') %>

## CLI with Zod Middleware

The main CLI applies `zodMiddleware` to each command. This validates parsed arguments against the schema and adds transformed properties to the args object.

<%= file('cli.ts') %>

## How It Works

1. CLI options are defined with basic types (`string`, `number`, `boolean`)
2. `zodMiddleware` wraps a Zod schema and returns a middleware function
3. When the command runs, the middleware validates args against the schema
4. If validation fails, Zod's error messages are displayed
5. If validation passes, the transformed output (including computed properties) becomes the new args

## Benefits

- **Validation**: Complex validation rules (email format, number ranges) with clear error messages
- **Transformation**: Normalize data and compute derived values
- **Type Safety**: TypeScript infers the output type from the schema, including transformed properties
- **Reusability**: Schemas can be shared across commands or used in other parts of your application
