# TypeScript Configuration and Setup

CLI Forge is built with first class TypeScript support. This enables you to write your cli commands in typescript and take advantage of the type safety and intellisense that TypeScript provides for every option you expect.

## TypeScript Configuration

To get the full benefits of TypeScript with CLI Forge, its recommended to enable `strict` mode in your `tsconfig.json` file. This will enable all the strict type checking options that TypeScript provides.

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

With `strict` mode enabled, you will get the following benefits:

- Optional arguments will be potentially `undefined`, and you will need to explicitly handle that in your code.
- Arguments with default values will not be considered optional.

## TypeScript Setup

TypeScript will be setup for you by default when running `npx cli-forge init`.

## Options Inference

CLI Forge will infer the types of your parsed arguments based on the builder you provide. You can see this in every example located in the [CLI Forge Examples](../examples/index.md),
