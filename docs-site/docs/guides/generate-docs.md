# Autogenerate CLI Documentation

Any CLI that is written with CLI forge can utilize `npx cli-forge generate-docs` to generate documentation.

By default, the command will generate documentation for your CLI in markdown. The templates for the markdown are not customizable.

For an example of what this generated documentation looks like, see the [CLI section of the docs](/cli/).

## Enabling Documentation Generation

As mentioned, all CLIs that utilize CLI Forge can generate documentation. There are two conditions for this to work:

- Your CLI instance itself must be exported from the file that you pass to `cli-forge generate-docs`.

  While this isn't needed for the CLI to function, its needed for CLI Forge's CLI to be able to get access to the internal structure of your CLI.

- If generating markdown, the `markdown-factory` package must be installed in your project.

  `markdown-factory` is an optional peer dependency of CLI Forge, so you may need to install it yourself. If you created your CLI with `npx cli-forge init`, it will be installed for you. If not, it should be installed as a dev dependency as your CLI will not depend on it at runtime. `markdown-factory` is used to render the dynamic markdown templates that CLI Forge uses to generate documentation.

## Customizing Output

Even though the templates are not directly customizable, you can still customize the output of the documentation by using the `--format` flag. This flag allows you to generate json output instead of markdown, which you can then use to generate your own documentation.

```sh
npx cli-forge generate-docs ./bin/{my-cli}.js --format json
```

The json output is the raw data structure that is used when generating the markdown documentation, so it should contain all the information you need to generate your own documentation.

## TypeScript Support

If your CLI is written in TypeScript, CLI Forge will use [`tsx`](https://npmjs.com/tsx) to import the typescript files without needing to compile them first. `tsx` is an optional peer dependency of CLI Forge, so you may need to install it yourself. If you created your CLI with `npx cli-forge init`, it will be installed for you. If not, it should be installed as a dev dependency as your CLI will not depend on it at runtime.

The documentation itself will not be change if you decide to point to the typescript source file or the compiled javascript file. Given this, if you wish to avoid the overhead of using `tsx`, you can compile your typescript files first and then point to the compiled javascript file when generating documentation.
