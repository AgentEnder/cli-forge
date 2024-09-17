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