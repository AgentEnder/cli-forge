## 1.10.0 (2026-04-23)

### 🚀 Features

- display option aliases in help output and hide auto-generated ones ([#90](https://github.com/agentender/cli-forge/pull/90))
- **cli-forge:** lightweight DI via .provide() and getCommandContext() ([#79](https://github.com/agentender/cli-forge/pull/79))

### 🩹 Fixes

- **cli-forge:** honor `hidden: true` for subcommands in generated help ([#93](https://github.com/agentender/cli-forge/pull/93), [#43](https://github.com/agentender/cli-forge/issues/43))
- **docs-site:** refactor playground module system to support multi-file examples ([#84](https://github.com/agentender/cli-forge/pull/84))

### ❤️ Thank You

- AgentEnder @AgentEnder
- Claude
- Copilot @Copilot
- Craigory Coppola @AgentEnder

## 1.9.2 (2026-04-11)

### 🩹 Fixes

- **cli-forge:** display object option property details in --help output ([#74](https://github.com/agentender/cli-forge/pull/74))
- **docs-site:** add clickable anchor links to headings ([#73](https://github.com/agentender/cli-forge/pull/73))
- **parser:** support oneOf/coerce for dual-syntax object properties ([#72](https://github.com/agentender/cli-forge/pull/72))

### ❤️ Thank You

- Claude
- Craigory Coppola @AgentEnder

## 1.9.1 (2026-04-09)

### 🩹 Fixes

- **cli-forge:** flatten types in ComposableBuilder and ArgumentsOf ([#71](https://github.com/agentender/cli-forge/pull/71))
- **docs-site:** ensure extract-api-docs runs before docs-site build and preview ([5f7b8ab](https://github.com/agentender/cli-forge/commit/5f7b8ab))
- **docs-site:** patch rehype-typedoc to disambiguate colliding slugs ([#70](https://github.com/agentender/cli-forge/pull/70))

### ❤️ Thank You

- Claude
- Craigory Coppola @AgentEnder

## 1.9.0 (2026-04-08)

### 🚀 Features

- **cli-forge:** add oneOf option overload to CLI interface ([3b2b288](https://github.com/agentender/cli-forge/commit/3b2b288))
- **cli-forge:** add oneOf support to help text formatting ([813ffbc](https://github.com/agentender/cli-forge/commit/813ffbc))
- **docs-site:** add entry file picker to playground run button ([77cbcdf](https://github.com/agentender/cli-forge/commit/77cbcdf))
- **parser:** add OneOfOptionConfig type definition ([0e17dab](https://github.com/agentender/cli-forge/commit/0e17dab))
- **parser:** add oneOf type resolution to BaseType ([4e1de0d](https://github.com/agentender/cli-forge/commit/4e1de0d))
- **parser:** implement oneOf parser with priority resolution ([fb0eb7b](https://github.com/agentender/cli-forge/commit/fb0eb7b))
- **parser:** add oneOf option overload with union type inference ([d1e7705](https://github.com/agentender/cli-forge/commit/d1e7705))
- **parser:** add oneOf option overload with union type inference ([5f45164](https://github.com/agentender/cli-forge/commit/5f45164))

### 🩹 Fixes

- **cli-forge:** flatten handler args type for cleaner tooltips ([4c26fb7](https://github.com/agentender/cli-forge/commit/4c26fb7))
- **cli-forge:** flatten TArgs at accumulation points ([bf55342](https://github.com/agentender/cli-forge/commit/bf55342))
- **docs-site:** fix vale errors in comparison guide ([aa2c2d9](https://github.com/agentender/cli-forge/commit/aa2c2d9))
- **docs-site:** add rehype plugin to prepend base URL to root-relative links ([30aaaa7](https://github.com/agentender/cli-forge/commit/30aaaa7))
- **docs-site:** address PR review comments ([dc43795](https://github.com/agentender/cli-forge/commit/dc43795))
- **parser:** fix oneOf type resolution losing union members ([777075b](https://github.com/agentender/cli-forge/commit/777075b))

### ❤️ Thank You

- Claude
- Craigory Coppola @AgentEnder

## 1.8.1 (2026-04-08)

### 🩹 Fixes

- **repo:** prevent scripts package from being published by nx release ([#66](https://github.com/agentender/cli-forge/pull/66))

### ❤️ Thank You

- Claude
- Craigory Coppola @AgentEnder

## 1.8.0 (2026-04-08)

### 🚀 Features

- **cli-forge:** add browser compatibility and interactive playground ([#52](https://github.com/agentender/cli-forge/pull/52))
- **cli-forge:** formalize bun support with e2e tests, docs, and CI ([#61](https://github.com/agentender/cli-forge/pull/61))
- **cli-forge:** include resolved env keys in generated documentation ([e5cbe18](https://github.com/agentender/cli-forge/commit/e5cbe18))
- **cli-forge:** add fluent .handler() method ([0345bcd](https://github.com/agentender/cli-forge/commit/0345bcd))

### 🩹 Fixes

- **parser:** handle UPPER_SNAKE_CASE in env key transformation ([#65](https://github.com/agentender/cli-forge/pull/65))
- **repo:** react to triggering review directly instead of searching issue comments ([#57](https://github.com/agentender/cli-forge/pull/57))

### ❤️ Thank You

- AgentEnder @AgentEnder
- Claude
- Craigory Coppola @AgentEnder

## 1.7.2 (2026-04-03)

### 🩹 Fixes

- **cli-forge:** resolve CLI module paths from cwd in import() fallback ([#55](https://github.com/agentender/cli-forge/pull/55))
- **cli-forge:** expose cli export for programmatic access ([41f9beb](https://github.com/agentender/cli-forge/commit/41f9beb))
- **repo:** step through npm@10 before upgrading to npm@latest in deploy workflow ([#56](https://github.com/agentender/cli-forge/pull/56))

### ❤️ Thank You

- AgentEnder @AgentEnder
- Copilot @Copilot
- Craigory Coppola @AgentEnder

## 1.7.1 (2026-03-25)

This was a version bump only, there were no code changes.

## 1.7.0 (2026-03-25)

### 🚀 Features

- **cli-forge:** add shell completion support ([cd0e16d](https://github.com/agentender/cli-forge/commit/cd0e16d))
- **docs-site:** support example template references in guide docs ([784b4b9](https://github.com/agentender/cli-forge/commit/784b4b9))

### 🩹 Fixes

- run vale from docs-site cwd ([9a371ab](https://github.com/agentender/cli-forge/commit/9a371ab))
- **cli-forge:** add @types/node and types config to init template ([ec86d27](https://github.com/agentender/cli-forge/commit/ec86d27))
- **docs-site:** use sentence case headings in existing guides ([10683cf](https://github.com/agentender/cli-forge/commit/10683cf))
- **docs-site:** disable heading rule for generated HTML dist files ([e8f9c02](https://github.com/agentender/cli-forge/commit/e8f9c02))

### ❤️ Thank You

- AgentEnder @AgentEnder
- Claude
- Craigory Coppola @AgentEnder

## 1.6.0 (2026-03-19)

### 🚀 Features

- **parser:** support updater functions in updateConfig via proxy tracking ([712420f](https://github.com/agentender/cli-forge/commit/712420f))

### 🩹 Fixes

- **docs-site:** render changelog ([e28bcbd](https://github.com/agentender/cli-forge/commit/e28bcbd))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 1.5.0 (2026-03-19)

### 🚀 Features

- **cli-forge:** expose updateConfig and accept AnyConfigProvider in CLI layer ([3fbbe1d](https://github.com/agentender/cli-forge/commit/3fbbe1d))
- **cli-forge:** update ConfigurationProviders.JsonFile for aggregate return type ([0ed0a5f](https://github.com/agentender/cli-forge/commit/0ed0a5f))
- **parser:** add AggregateConfigProvider skeleton and type guard ([6702268](https://github.com/agentender/cli-forge/commit/6702268))
- **parser:** implement AggregateConfigProvider.load with provenance tracking ([54ac294](https://github.com/agentender/cli-forge/commit/54ac294))
- **parser:** implement AggregateConfigProvider.updateConfig with provenance routing ([8596a31](https://github.com/agentender/cli-forge/commit/8596a31))
- **parser:** implement AggregateConfigProvider.describeConfig ([dd898bb](https://github.com/agentender/cli-forge/commit/dd898bb))
- **parser:** integrate AggregateConfigProvider into ArgvParser ([ffa8e58](https://github.com/agentender/cli-forge/commit/ffa8e58))

### 🩹 Fixes

- **cli-forge:** remove as-any cast and apply key-aware describeConfig for multi-file JsonFile ([70da737](https://github.com/agentender/cli-forge/commit/70da737))
- **cli-forge:** use __dirname instead of import.meta.url in e2e update tests ([f59b26c](https://github.com/agentender/cli-forge/commit/f59b26c))
- **parser:** fix TS diagnostics in AggregateConfigProvider skeleton ([32357d9](https://github.com/agentender/cli-forge/commit/32357d9))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 1.4.0 (2026-03-18)

### 🚀 Features

- **cli-forge:** add config documentation generation and updateConfig support ([f740fe7](https://github.com/agentender/cli-forge/commit/f740fe7))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 1.3.0 (2026-03-18)

### 🚀 Features

- **@cli-forge/parser:** support choices type inference for array options ([b9bd96a](https://github.com/agentender/cli-forge/commit/b9bd96a))
- **cli-forge:** add prompt provider type definitions ([8c570f2](https://github.com/agentender/cli-forge/commit/8c570f2))
- **cli-forge:** add withPromptProvider registration method ([60da1a3](https://github.com/agentender/cli-forge/commit/60da1a3))
- **cli-forge:** implement prompt resolution in forge() lifecycle ([2aea85c](https://github.com/agentender/cli-forge/commit/2aea85c))
- **cli-forge:** add clack prompt provider ([d517620](https://github.com/agentender/cli-forge/commit/d517620))
- **cli-forge:** propagate prompt providers through clone and command chain ([0a74843](https://github.com/agentender/cli-forge/commit/0a74843))
- **cli-forge:** add stream options to clack prompt provider ([c257ff4](https://github.com/agentender/cli-forge/commit/c257ff4))
- **docs-site:** scaffold Vike migration (tasks 1-8) ([624e35e](https://github.com/agentender/cli-forge/commit/624e35e))
- **docs-site:** add Vike pages, layout, and global context ([694bb27](https://github.com/agentender/cli-forge/commit/694bb27))
- **docs-site:** integrate TypeDoc API docs and content.md prose rendering ([fe93ca9](https://github.com/agentender/cli-forge/commit/fe93ca9))
- **docs-site:** render example descriptions through markdown pipeline ([91642a5](https://github.com/agentender/cli-forge/commit/91642a5))
- **docs-site:** add table-of-contents sidebar for doc pages ([4e19852](https://github.com/agentender/cli-forge/commit/4e19852))
- **docs-site:** add table-of-contents to all page types ([02eb76d](https://github.com/agentender/cli-forge/commit/02eb76d))

### 🩹 Fixes

- **cli-forge:** address code review feedback for prompt layer ([9b0e8bc](https://github.com/agentender/cli-forge/commit/9b0e8bc))
- **docs-site:** resolve build issues and update frontmatter ([8ed551c](https://github.com/agentender/cli-forge/commit/8ed551c))
- **docs-site:** resolve TypeScript errors in server utils and pages ([e512558](https://github.com/agentender/cli-forge/commit/e512558))
- **docs-site:** fix SiteExampleFile class and remove unused import ([490a9af](https://github.com/agentender/cli-forge/commit/490a9af))
- **docs-site:** make Home and Changelog top-level nav items ([f6a6087](https://github.com/agentender/cli-forge/commit/f6a6087))
- **docs-site:** fix breadcrumb for top-level pages and README logo path ([99d564e](https://github.com/agentender/cli-forge/commit/99d564e))
- **docs-site:** hide _toplevel docs from docs index page ([af70b5a](https://github.com/agentender/cli-forge/commit/af70b5a))
- **docs-site:** show top-level docs on index, fix content.md syntax ([70396f9](https://github.com/agentender/cli-forge/commit/70396f9))
- **docs-site:** fix fenced code block regex to handle title metadata ([d2c4d35](https://github.com/agentender/cli-forge/commit/d2c4d35))
- **docs-site:** formatting and layout tweaks ([fd29a42](https://github.com/agentender/cli-forge/commit/fd29a42))

### ❤️ Thank You

- Claude
- Craigory Coppola @AgentEnder

## 1.2.3 (2026-02-19)

### 🚀 Features

- add functional-examples configuration ([89daa89](https://github.com/agentender/cli-forge/commit/89daa89))
- migrate basic-cli example to functional-examples schema ([f84b338](https://github.com/agentender/cli-forge/commit/f84b338))
- migrate single-file examples to functional-examples schema ([13ec526](https://github.com/agentender/cli-forge/commit/13ec526))
- migrate multi-file example metadata to functional-examples schema ([b6b0400](https://github.com/agentender/cli-forge/commit/b6b0400))
- update e2e:examples to use functional-examples CLI ([df842ce](https://github.com/agentender/cli-forge/commit/df842ce))
- **docs:** replace collectExamples with scanExamples ([64484ed](https://github.com/agentender/cli-forge/commit/64484ed))
- **docs:** update content processing for functional-examples ([8507e1a](https://github.com/agentender/cli-forge/commit/8507e1a))

### 🩹 Fixes

- **docs:** complete migration to functional-examples in Docusaurus plugin ([62d0b77](https://github.com/agentender/cli-forge/commit/62d0b77))
- **docs:** resolve TypeScript errors and clean up unused code ([a7234b6](https://github.com/agentender/cli-forge/commit/a7234b6))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 1.2.2 (2026-02-17)

### 🩹 Fixes

- **cli-forge:** builder of command with -zsh alias should run before parsing ([db10526](https://github.com/agentender/cli-forge/commit/db10526))
- **cli-forge:** prevent double execution of $0-aliased subcommand builders ([6f09a7b](https://github.com/agentender/cli-forge/commit/6f09a7b))

### ❤️ Thank You

- Claude
- Craigory Coppola @AgentEnder

## 1.2.1 (2026-02-13)

### 🩹 Fixes

- **cli-forge:** use subcommand-aware unmatchedParser in discovery loop ([ce6e940](https://github.com/agentender/cli-forge/commit/ce6e940))
- **parser:** only consume 'true'/'false' as boolean flag values ([8acb1ae](https://github.com/agentender/cli-forge/commit/8acb1ae))
- **parser:** check unmatchedParser before positional matching ([3355d0c](https://github.com/agentender/cli-forge/commit/3355d0c))

### ❤️ Thank You

- Claude
- Craigory Coppola @AgentEnder

## 1.2.0 (2026-02-09)

### 🚀 Features

- add strip-dashed support for automatic camelCase/kebab-case aliasing ([#39](https://github.com/agentender/cli-forge/pull/39), [#38](https://github.com/agentender/cli-forge/issues/38))
- **cli-forge:** use Set for middleware storage to enable idempotent registration ([5a002d1](https://github.com/agentender/cli-forge/commit/5a002d1))
- **cli-forge:** capture-and-replay in makeComposableBuilder for stable middleware refs ([aee7c7c](https://github.com/agentender/cli-forge/commit/aee7c7c))
- **cli-forge:** add init hooks with incremental re-parse for plugin loading ([2a2f6c2](https://github.com/agentender/cli-forge/commit/2a2f6c2))
- **cli-forge:** run init hooks at every command level ([90dce06](https://github.com/agentender/cli-forge/commit/90dce06))
- **cli-forge:** run middleware before init hooks in discovery loop ([4773480](https://github.com/agentender/cli-forge/commit/4773480))
- **parser:** add lenient parse mode for init hooks ([0266ea6](https://github.com/agentender/cli-forge/commit/0266ea6))
- **parser:** add validate option and alreadyParsed parameter ([1f309e3](https://github.com/agentender/cli-forge/commit/1f309e3))

### 🩹 Fixes

- **cli-forge:** always run root builder before child commands ([a9390b8](https://github.com/agentender/cli-forge/commit/a9390b8))
- **cli-forge:** cli.command(cli('-zsh', ...)) should work for assigning root command ([e325bc4](https://github.com/agentender/cli-forge/commit/e325bc4))
- **parser:** move circular config detection from provider state to resolution call ([0b39a72](https://github.com/agentender/cli-forge/commit/0b39a72))

### ❤️ Thank You

- AgentEnder @AgentEnder
- Claude
- Copilot @Copilot
- Craigory Coppola @AgentEnder

## 1.1.0 (2025-12-24)

### 🚀 Features

- **cli-forge:** generate llms.txt when generating markdown docs ([3745ccb](https://github.com/agentender/cli-forge/commit/3745ccb))
- **cli-forge,parser:** add strict mode to parser and CLI ([d9299d7](https://github.com/agentender/cli-forge/commit/d9299d7))

### ❤️ Thank You

- AgentEnder @AgentEnder
- Craigory Coppola @AgentEnder

## 1.0.2 (2025-12-19)

### 🩹 Fixes

- **cli-forge:** ensure handler return types flow through sdk typings properly ([36c6a12](https://github.com/agentender/cli-forge/commit/36c6a12))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 1.0.1 (2025-12-19)

### 🩹 Fixes

- **cli-forge:** ensure sibling command handlers are typed properly ([82bff84](https://github.com/agentender/cli-forge/commit/82bff84))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

# 1.0.0 (2025-12-19)

### 🚀 Features

- **cli-forge:** add sdk() method for programmatic CLI invocation ([8b87697](https://github.com/agentender/cli-forge/commit/8b87697))
- **cli-forge:** improve SDK and getBuilder composability ([793df62](https://github.com/agentender/cli-forge/commit/793df62))
- ⚠️ **parser:** remove additionalProperties from object options ([4d0cfd5](https://github.com/agentender/cli-forge/commit/4d0cfd5))

### ⚠️ Breaking Changes

- **parser:** remove additionalProperties from object options ([4d0cfd5](https://github.com/agentender/cli-forge/commit/4d0cfd5))
  The `additionalProperties` option has been removed from
  object option configuration.
  Rationale for removal:
  - The feature added significant type complexity (WithAdditionalProperties,
    index signature unions) that complicated the type inference system
  - Index signatures with union types created confusing bracket-access
    semantics where explicit properties mixed with additional property types
  - The use case for dynamic additional properties is better served by
    using a coerce function to transform the value, or by defining explicit
    properties upfront
  - Removing this simplifies the type resolution pipeline and makes
    object option types more predictable
    Migration: If you were using `additionalProperties`, either:
  1. Add explicit properties for the keys you need
  2. Use a `coerce` function to handle dynamic properties
  3. Use a `Record<string, T>` type via `coerce` for fully dynamic objects
     Affected APIs:
  - ObjectOptionConfig no longer accepts additionalProperties parameter
  - OptionConfig type now has 3 type parameters instead of 4
  - WithAdditionalProperties type helper has been removed

### ❤️ Thank You

- Craigory Coppola

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

- Craigory Coppola @AgentEnder

## 0.10.1 (2024-09-20)

### 🩹 Fixes

- **cli-forge:** fix bin entries for init to exclude .ts extension ([d35e315](https://github.com/agentender/cli-forge/commit/d35e315))
- **cli-forge:** interactive subshell help should work ([61f8f18](https://github.com/agentender/cli-forge/commit/61f8f18))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 0.10.0 (2024-09-18)

### 🚀 Features

- **parser:** add env config options `reflect` and `populate` ([#24](https://github.com/agentender/cli-forge/pull/24))

### 🩹 Fixes

- **parser:** optional arguments are possibly undefined ([#25](https://github.com/agentender/cli-forge/pull/25))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 0.9.0 (2024-09-17)

### 🚀 Features

- **cli-forge:** add arguments-of helper and command alias support ([b56bedb](https://github.com/agentender/cli-forge/commit/b56bedb))
- **cli-forge,parser:** add support for loading args from configuration files ([4439ece](https://github.com/agentender/cli-forge/commit/4439ece))
- **docs-site:** support for multifile examples ([161cf08](https://github.com/agentender/cli-forge/commit/161cf08))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 0.8.1 (2024-09-16)

### 🩹 Fixes

- **cli-forge:** generate-docs should work on windows ([fc9243a](https://github.com/agentender/cli-forge/commit/fc9243a))

### ❤️ Thank You

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

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 0.7.0 (2024-08-31)

### 🚀 Features

- **cli-forge:** hide hidden options ([fb0b1d3](https://github.com/agentender/cli-forge/commit/fb0b1d3))
- **cli-forge:** add support for renderning grouped options ([67dcd8e](https://github.com/agentender/cli-forge/commit/67dcd8e))
- **cli-forge:** initial draft for middleware ([953b9b7](https://github.com/agentender/cli-forge/commit/953b9b7))
- **cli-parser:** add epilogue support ([395a1ea](https://github.com/agentender/cli-forge/commit/395a1ea))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 0.6.0 (2024-08-30)

### 🚀 Features

- **cli-forge:** add implicit --version handler ([a45be15](https://github.com/agentender/cli-forge/commit/a45be15))
- **cli-forge:** interactive shell ([8fae952](https://github.com/agentender/cli-forge/commit/8fae952))
- **parser:** allow passing positional args as flag ([f1392c2](https://github.com/agentender/cli-forge/commit/f1392c2))

### 🩹 Fixes

- **cli-forge:** use tsx to load typescript clis when generating docs if it is available ([4dafd37](https://github.com/agentender/cli-forge/commit/4dafd37))
- **parser:** clone conflicts and implies when cloning object ([9402b82](https://github.com/agentender/cli-forge/commit/9402b82))

### ❤️ Thank You

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

### ❤️ Thank You

- Craigory Coppola

## 0.4.0 (2024-08-28)

### 🚀 Features

- **cli-forge:** support for `cli(...).commands()` ([#2](https://github.com/agentender/cli-forge/pull/2))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 0.3.0 (2024-08-26)

### 🚀 Features

- **cli-forge:** generate-documentation support ([c330733](https://github.com/agentender/cli-forge/commit/c330733))
- **cli-forge:** add init command ([d733f4d](https://github.com/agentender/cli-forge/commit/d733f4d))

### ❤️ Thank You

- Craigory Coppola @AgentEnder

## 0.2.0 (2024-08-24)

### 🚀 Features

- **docs-site:** add docs site + examples setup ([6e62fa5](https://github.com/agentender/cli-forge/commit/6e62fa5))
- **parser:** support kebab case and camel case options ([a2cd6f0](https://github.com/agentender/cli-forge/commit/a2cd6f0))

### 🩹 Fixes

- **parser:** support --flag=value ([e00934e](https://github.com/agentender/cli-forge/commit/e00934e))

### ❤️ Thank You

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

### ❤️ Thank You

- Craigory Coppola @AgentEnder
