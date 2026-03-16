# generate-documentation

**Usage:** `cli-forge generate-documentation <cli>`

Generate documentation for the given CLI

## Positional Arguments

### cli

**Type:** string

Path to the cli that docs should be generated for.

**Required**

## Flags

### help

**Type:** boolean

Show help for the current command

#### Aliases

- h

### version

**Type:** boolean

Show the version number for the CLI

### output

**Type:** string

Where should the documentation be output?

**Default:** `"docs"`

#### Aliases

- o

### format

**Type:** string

What format should the documentation be output in?

**Default:** `"md"`

**Valid values:** `json`, `md`

### export

**Type:** string

The name of the export that contains the CLI instance. By default, docs will be generated for the default export.

### tsconfig

**Type:** string

Specifies the `tsconfig` used when loading typescript based CLIs.

### llms

**Type:** boolean

Generate an llms.txt file describing the CLI for AI agents.

**Default:** `true`

## Examples

```shell
cli-forge generate-documentation ./bin/my-cli
```

```shell
cli-forge generate-documentation ./bin/my-cli --format json
```

```shell
cli-forge generate-documentation ./bin/my-cli --export mycli
```