## 0.12.0 (2025-12-11)

### 🚀 Features

- **cli-forge:** add TChildren, THandlerReturn, TParent type parameters to CLI interface ([d59c213](https://github.com/agentender/cli-forge/commit/d59c213))
- **cli-forge:** implement getChildren, getParent, getHandler methods ([d9ed677](https://github.com/agentender/cli-forge/commit/d9ed677))
- **cli-forge:** enhance makeComposableBuilder to track children types ([04cf6be](https://github.com/agentender/cli-forge/commit/04cf6be))

### 🩹 Fixes

- **cli-forge:** update CLI type annotations in documentation tools ([3bfda46](https://github.com/agentender/cli-forge/commit/3bfda46))
- **e2e:** prevent flaky module resolution in examples ([4462654](https://github.com/agentender/cli-forge/commit/4462654))
- **e2e:** use --build mode for tsc --force flag ([56eec7c](https://github.com/agentender/cli-forge/commit/56eec7c))
- **parser:** use explicit .js extensions in config-files imports ([3289c84](https://github.com/agentender/cli-forge/commit/3289c84))
- **parser:** fix additionalProperties type compatibility with nested objects ([79b7b0a](https://github.com/agentender/cli-forge/commit/79b7b0a))
- **parser:** update option overloads to use new additionalProperties types ([f1e6247](https://github.com/agentender/cli-forge/commit/f1e6247))
- **parser:** improve WithAdditionalProperties type to use intersection ([8d7da19](https://github.com/agentender/cli-forge/commit/8d7da19))
- **type-tests:** add @ts-expect-error comments to intentional type errors ([3f94e79](https://github.com/agentender/cli-forge/commit/3f94e79))
- **type-tests:** update fixtures for correct type usage patterns ([27904be](https://github.com/agentender/cli-forge/commit/27904be))
- **type-tests:** update fixtures for new additionalProperties semantics ([5dcba96](https://github.com/agentender/cli-forge/commit/5dcba96))

### ❤️ Thank You

- Claude
- Claude Opus 4.5
- Craigory Coppola @AgentEnder

## 0.11.0 (2025-12-04)

### 🚀 Features

- **cli-forge:** add ESM/CJS module detection for documentation generation ([bbc0c85](https://github.com/agentender/cli-forge/commit/bbc0c85))
- **cli-forge:** add type-safe cli() wrapper with object option overloads ([c160918](https://github.com/agentender/cli-forge/commit/c160918))
- **core:** allow middleware to return new object instead of mutating original object ([a5db3c7](https://github.com/agentender/cli-forge/commit/a5db3c7))
- **docs-site:** preliminary support for ts-playground ([#27](https://github.com/agentender/cli-forge/pull/27))
- **middleware:** add zod middleware ([e34b25f](https://github.com/agentender/cli-forge/commit/e34b25f))
- **parser:** add object option overloads and improve type safety ([beb2117](https://github.com/agentender/cli-forge/commit/beb2117))

### 🩹 Fixes

- improve local registry package.json reset handling ([e1f3d0d](https://github.com/agentender/cli-forge/commit/e1f3d0d))
- resolve CI failures on main branch ([bfd4bcb](https://github.com/agentender/cli-forge/commit/bfd4bcb))
- restore useEffect cleanup for editor in playground component ([7b17e1f](https://github.com/agentender/cli-forge/commit/7b17e1f))
- **ci:** use npx instead of node to run nx ([5cdc141](https://github.com/agentender/cli-forge/commit/5cdc141))
- **ci:** configure npm OIDC trusted publishing correctly ([c4fa18f](https://github.com/agentender/cli-forge/commit/c4fa18f))
- **cli-forge:** improve peerDependenciesMeta type checking ([0140173](https://github.com/agentender/cli-forge/commit/0140173))
- **cli-forge:** ensure tui exits properly when user types exit ([eea5270](https://github.com/agentender/cli-forge/commit/eea5270))
- **docs-site:** playground should support full types + expose playground ([e6eb29f](https://github.com/agentender/cli-forge/commit/e6eb29f))
- **repo:** shim cli-forge to allow pnpm to resolve it prior to build ([df9e9f8](https://github.com/agentender/cli-forge/commit/df9e9f8))
- **type-tests:** fix failing tests in compiler and query specs ([a329aad](https://github.com/agentender/cli-forge/commit/a329aad))

### ❤️ Thank You

- AgentEnder @AgentEnder
- Claude
- Craigory Coppola @AgentEnder

## 0.10.1 (2024-09-20)


### 🩹 Fixes

- **cli-forge:** fix bin entries for init to exclude .ts extension ([d35e315](https://github.com/agentender/cli-forge/commit/d35e315))
- **cli-forge:** interactive subshell help should work ([61f8f18](https://github.com/agentender/cli-forge/commit/61f8f18))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.10.0 (2024-09-18)


### 🚀 Features

- **parser:** add env config options `reflect` and `populate` ([#24](https://github.com/agentender/cli-forge/pull/24))

### 🩹 Fixes

- **parser:** optional arguments are possibly undefined ([#25](https://github.com/agentender/cli-forge/pull/25))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.9.0 (2024-09-17)


### 🚀 Features

- **cli-forge:** add arguments-of helper and command alias support ([b56bedb](https://github.com/agentender/cli-forge/commit/b56bedb))
- **cli-forge,parser:** add support for loading args from configuration files ([4439ece](https://github.com/agentender/cli-forge/commit/4439ece))
- **docs-site:** support for multifile examples ([161cf08](https://github.com/agentender/cli-forge/commit/161cf08))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.8.1 (2024-09-16)


### 🩹 Fixes

- **cli-forge:** generate-docs should work on windows ([fc9243a](https://github.com/agentender/cli-forge/commit/fc9243a))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.8.0 (2024-09-05)


### 🚀 Features

- **cli-forge,parser:** add composition helpers `chain` and `makeComposable*` ([8063d13](https://github.com/agentender/cli-forge/commit/8063d13))
- **parser:** support negated booleans (--no-x) ([25e8da3](https://github.com/agentender/cli-forge/commit/25e8da3))
- **parser:** support object-valued flags ([09ce196](https://github.com/agentender/cli-forge/commit/09ce196))
- **parser:** allow setting descriptions for default values ([d1197f9](https://github.com/agentender/cli-forge/commit/d1197f9))

### 🩹 Fixes

- **cli-forge:** fixup init to include tsc infra ([51b1d18](https://github.com/agentender/cli-forge/commit/51b1d18))
- **parser:** choices should narrow arg typing ([0a913e2](https://github.com/agentender/cli-forge/commit/0a913e2))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.7.0 (2024-08-31)


### 🚀 Features

- **cli-forge:** hide hidden options ([fb0b1d3](https://github.com/agentender/cli-forge/commit/fb0b1d3))
- **cli-forge:** add support for renderning grouped options ([67dcd8e](https://github.com/agentender/cli-forge/commit/67dcd8e))
- **cli-forge:** initial draft for middleware ([953b9b7](https://github.com/agentender/cli-forge/commit/953b9b7))
- **cli-parser:** add epilogue support ([395a1ea](https://github.com/agentender/cli-forge/commit/395a1ea))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.6.0 (2024-08-30)


### 🚀 Features

- **cli-forge:** add implicit --version handler ([a45be15](https://github.com/agentender/cli-forge/commit/a45be15))
- **cli-forge:** interactive shell ([8fae952](https://github.com/agentender/cli-forge/commit/8fae952))
- **parser:** allow passing positional args as flag ([f1392c2](https://github.com/agentender/cli-forge/commit/f1392c2))

### 🩹 Fixes

- **cli-forge:** use tsx to load typescript clis when generating docs if it is available ([4dafd37](https://github.com/agentender/cli-forge/commit/4dafd37))
- **parser:** clone conflicts and implies when cloning object ([9402b82](https://github.com/agentender/cli-forge/commit/9402b82))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.5.0 (2024-08-29)


### 🚀 Features

- **cli-forge:** add test harness for checking args and command parsing ([e068033](https://github.com/agentender/cli-forge/commit/e068033))
- **cli-forge:** add support for implies and conflicts ([5afdcc5](https://github.com/agentender/cli-forge/commit/5afdcc5))
- **cli-forge:** support for usage + examples ([9fca5e7](https://github.com/agentender/cli-forge/commit/9fca5e7))
- **parser:** add support for reading args from environment ([d6a7edb](https://github.com/agentender/cli-forge/commit/d6a7edb))
- **parser:** add support for restricting valid values ([fe817fe](https://github.com/agentender/cli-forge/commit/fe817fe))
- **parser:** support deprecated options ([affaaa6](https://github.com/agentender/cli-forge/commit/affaaa6))

### 🩹 Fixes

- **cli-forge:** require command by default when no handler is provided ([1703351](https://github.com/agentender/cli-forge/commit/1703351))
- **cli-forge:** --help should not throw on argument validation errors ([f6859d9](https://github.com/agentender/cli-forge/commit/f6859d9))
- **cli-forge:** properly link subcommands on index pages ([26a43af](https://github.com/agentender/cli-forge/commit/26a43af))
- **parser:** unprefixed args not loading properly ([4ce145f](https://github.com/agentender/cli-forge/commit/4ce145f))

### ❤️  Thank You

- Craigory Coppola

## 0.4.0 (2024-08-28)


### 🚀 Features

- **cli-forge:** support for `cli(...).commands()` ([#2](https://github.com/agentender/cli-forge/pull/2))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.3.0 (2024-08-26)


### 🚀 Features

- **cli-forge:** generate-documentation support ([c330733](https://github.com/agentender/cli-forge/commit/c330733))
- **cli-forge:** add init command ([d733f4d](https://github.com/agentender/cli-forge/commit/d733f4d))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.2.0 (2024-08-24)


### 🚀 Features

- **docs-site:** add docs site + examples setup ([6e62fa5](https://github.com/agentender/cli-forge/commit/6e62fa5))
- **parser:** support kebab case and camel case options ([a2cd6f0](https://github.com/agentender/cli-forge/commit/a2cd6f0))

### 🩹 Fixes

- **parser:** support --flag=value ([e00934e](https://github.com/agentender/cli-forge/commit/e00934e))

### ❤️  Thank You

- Craigory Coppola @AgentEnder

## 0.1.0 (2024-08-24)


### 🚀 Features

- initial impl for cli commands ([736a324](https://github.com/AgentEnder/cli-forge/commit/736a324))
- **cli-forge:** add help text generation and fixup subcommands ([11db4b1](https://github.com/AgentEnder/cli-forge/commit/11db4b1))
- **cli-forge:** support demand command ([c15f7f0](https://github.com/AgentEnder/cli-forge/commit/c15f7f0))
- **parser:** add support for coerce ([01e5f5f](https://github.com/AgentEnder/cli-forge/commit/01e5f5f))
- **parser:** alias support ([eb7b299](https://github.com/AgentEnder/cli-forge/commit/eb7b299))
- **parser:** support for default values ([1dcd427](https://github.com/AgentEnder/cli-forge/commit/1dcd427))
- **parser:** support for validators ([072066c](https://github.com/AgentEnder/cli-forge/commit/072066c))
- **parser:** support for `--` ([7698078](https://github.com/AgentEnder/cli-forge/commit/7698078))
- **parser:** support for passing array as multiple flags ([71cd161](https://github.com/AgentEnder/cli-forge/commit/71cd161))

### ❤️  Thank You

- Craigory Coppola @AgentEnder