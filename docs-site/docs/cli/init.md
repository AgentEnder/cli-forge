# init

**Usage:** `cli-forge init <cliName>`

Generate a new CLI

## Positional Arguments

### cliName

**Type:** string

Name of the CLI to generate.

**Required**

#### Aliases

- cli-name

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

Where should the CLI be created?

#### Aliases

- o

### format

**Type:** string

What format should the CLI be in?

**Default:** `"ts"`

**Valid values:** `js`, `ts`

### moduleType

**Type:** string

Module system for the generated project.

**Default:** `"esm"`

**Valid values:** `esm`, `cjs`

### initialVersion

**Type:** string

Initial version used when creating the package.json for the new CLI.

**Default:** `"0.0.1"`