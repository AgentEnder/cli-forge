"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[1402],{78062:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>l,contentTitle:()=>r,default:()=>d,frontMatter:()=>i,metadata:()=>s,toc:()=>p});var a=o(62540),t=o(43023);const i={id:"env-options",title:"Environment Options",description:"This example demonstrates how you can register options that are set via environment variables. There are two levels\nof environment variable support:\n- Global: By calling `.env()` on the CLI instance or parser, you can enable environment variable support for all options.\n- Local: By providing an `env` key on an option, you can enable or disable environment variable support for that option only.\n\nIn either case, there are a few common properties to be aware of:\n- Prefix: Set via `prefix` on the object passed to .env(), or disabled by passing `false` with the `env` property on an option. Setting a prefix will automatically add the prefix to the environment variable key. When calling `.env()` on a CLI, the prefix defaults to the top-level command name.\n- Reflect: By default if environment variable handling is enabled, environment variables are reflected to `process.env`. This can be disabled by passing `{reflect: false}` to `.env()` or setting `env` to contain `{reflect: false}` on an option.\n- Populate: By default if environment variable handling is enabled, environment variables are used to populate options. This can be disabled by passing `{populate: false}` to `.env()` or setting `env` to contain `{populate: false}` on an option. This allows you to reflect environment variables to `process.env` without populating options from the env.\n- Key: The key used when populating an option from env or reflecting to `process.env`. By default, the key is the option name in upper snake case. This can be overridden by setting the `env` key on an option.\n\nOptions passed on the command line will always take precedence over environment variables. Environment variables override configuration files as well as default values.\n",hide_title:!0},r="Environment Options",s={id:"examples/env-options",title:"Environment Options",description:"This example demonstrates how you can register options that are set via environment variables. There are two levels\nof environment variable support:\n- Global: By calling `.env()` on the CLI instance or parser, you can enable environment variable support for all options.\n- Local: By providing an `env` key on an option, you can enable or disable environment variable support for that option only.\n\nIn either case, there are a few common properties to be aware of:\n- Prefix: Set via `prefix` on the object passed to .env(), or disabled by passing `false` with the `env` property on an option. Setting a prefix will automatically add the prefix to the environment variable key. When calling `.env()` on a CLI, the prefix defaults to the top-level command name.\n- Reflect: By default if environment variable handling is enabled, environment variables are reflected to `process.env`. This can be disabled by passing `{reflect: false}` to `.env()` or setting `env` to contain `{reflect: false}` on an option.\n- Populate: By default if environment variable handling is enabled, environment variables are used to populate options. This can be disabled by passing `{populate: false}` to `.env()` or setting `env` to contain `{populate: false}` on an option. This allows you to reflect environment variables to `process.env` without populating options from the env.\n- Key: The key used when populating an option from env or reflecting to `process.env`. By default, the key is the option name in upper snake case. This can be overridden by setting the `env` key on an option.\n\nOptions passed on the command line will always take precedence over environment variables. Environment variables override configuration files as well as default values.\n",source:"@site/docs/examples/env.md",sourceDirName:"examples",slug:"/examples/env-options",permalink:"/cli-forge/examples/env-options",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{id:"env-options",title:"Environment Options",description:"This example demonstrates how you can register options that are set via environment variables. There are two levels\nof environment variable support:\n- Global: By calling `.env()` on the CLI instance or parser, you can enable environment variable support for all options.\n- Local: By providing an `env` key on an option, you can enable or disable environment variable support for that option only.\n\nIn either case, there are a few common properties to be aware of:\n- Prefix: Set via `prefix` on the object passed to .env(), or disabled by passing `false` with the `env` property on an option. Setting a prefix will automatically add the prefix to the environment variable key. When calling `.env()` on a CLI, the prefix defaults to the top-level command name.\n- Reflect: By default if environment variable handling is enabled, environment variables are reflected to `process.env`. This can be disabled by passing `{reflect: false}` to `.env()` or setting `env` to contain `{reflect: false}` on an option.\n- Populate: By default if environment variable handling is enabled, environment variables are used to populate options. This can be disabled by passing `{populate: false}` to `.env()` or setting `env` to contain `{populate: false}` on an option. This allows you to reflect environment variables to `process.env` without populating options from the env.\n- Key: The key used when populating an option from env or reflecting to `process.env`. By default, the key is the option name in upper snake case. This can be overridden by setting the `env` key on an option.\n\nOptions passed on the command line will always take precedence over environment variables. Environment variables override configuration files as well as default values.\n",hide_title:!0},sidebar:"tutorialSidebar",previous:{title:"Default Values",permalink:"/cli-forge/examples/default-values"},next:{title:"Interactive Subshell",permalink:"/cli-forge/examples/interactive-subshell"}},l={},p=[{value:"Code",id:"code",level:2},{value:"Usage",id:"usage",level:2}];function c(e){const n={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,t.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.header,{children:(0,a.jsx)(n.h1,{id:"environment-options",children:"Environment Options"})}),"\n",(0,a.jsx)(n.p,{children:"This example demonstrates how you can register options that are set via environment variables. There are two levels\nof environment variable support:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:["Global: By calling ",(0,a.jsx)(n.code,{children:".env()"})," on the CLI instance or parser, you can enable environment variable support for all options."]}),"\n",(0,a.jsxs)(n.li,{children:["Local: By providing an ",(0,a.jsx)(n.code,{children:"env"})," key on an option, you can enable or disable environment variable support for that option only."]}),"\n"]}),"\n",(0,a.jsx)(n.p,{children:"In either case, there are a few common properties to be aware of:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:["Prefix: Set via ",(0,a.jsx)(n.code,{children:"prefix"})," on the object passed to .env(), or disabled by passing ",(0,a.jsx)(n.code,{children:"false"})," with the ",(0,a.jsx)(n.code,{children:"env"})," property on an option. Setting a prefix will automatically add the prefix to the environment variable key. When calling ",(0,a.jsx)(n.code,{children:".env()"})," on a CLI, the prefix defaults to the top-level command name."]}),"\n",(0,a.jsxs)(n.li,{children:["Reflect: By default if environment variable handling is enabled, environment variables are reflected to ",(0,a.jsx)(n.code,{children:"process.env"}),". This can be disabled by passing ",(0,a.jsx)(n.code,{children:"{reflect: false}"})," to ",(0,a.jsx)(n.code,{children:".env()"})," or setting ",(0,a.jsx)(n.code,{children:"env"})," to contain ",(0,a.jsx)(n.code,{children:"{reflect: false}"})," on an option."]}),"\n",(0,a.jsxs)(n.li,{children:["Populate: By default if environment variable handling is enabled, environment variables are used to populate options. This can be disabled by passing ",(0,a.jsx)(n.code,{children:"{populate: false}"})," to ",(0,a.jsx)(n.code,{children:".env()"})," or setting ",(0,a.jsx)(n.code,{children:"env"})," to contain ",(0,a.jsx)(n.code,{children:"{populate: false}"})," on an option. This allows you to reflect environment variables to ",(0,a.jsx)(n.code,{children:"process.env"})," without populating options from the env."]}),"\n",(0,a.jsxs)(n.li,{children:["Key: The key used when populating an option from env or reflecting to ",(0,a.jsx)(n.code,{children:"process.env"}),". By default, the key is the option name in upper snake case. This can be overridden by setting the ",(0,a.jsx)(n.code,{children:"env"})," key on an option."]}),"\n"]}),"\n",(0,a.jsx)(n.p,{children:"Options passed on the command line will always take precedence over environment variables. Environment variables override configuration files as well as default values."}),"\n",(0,a.jsx)(n.h2,{id:"code",children:"Code"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-ts",metastring:'title="Environment Options" showLineNumbers',children:"import cli from 'cli-forge';\n\nconst myCLI = cli('env-options')\n  .command('hello', {\n    builder: (args) =>\n      args\n        .option('name', {\n          type: 'string',\n          description: 'The name to say hello to',\n          required: true,\n        })\n        .option('greeting', {\n          type: 'string',\n          // Providing a string to `env` here allows the `name` option\n          // to be read from an environment variable. The environment variable\n          // key is transformed to upper snake case. e.g.\n          // - `name` -> `NAME`\n          // - `myOption` -> `MY_OPTION`\n          // - `NAME` -> `NAME`\n          //\n          // If a prefix is provided via a parent `.env()` call, the prefix\n          // will be applied here as well. Setting `env` to false will disable\n          // environment variable reading for this option, even if `.env()` was\n          // called on the parent CLI.\n          env: 'GREETING',\n        }),\n    handler: (args) => {\n      console.log(`Hello, ${args.name}!`);\n    },\n  })\n  // Invoking .env() enables reading arguments from environment variables.\n  // The env key is based on the option name. e.g. For the option 'name', and\n  // the CLI name 'env-options', the environment variable would be ENV_OPTIONS_NAME.\n  .env();\n\n(async () => {\n  await myCLI.forge();\n})();\n\n"})}),"\n",(0,a.jsx)(n.p,{children:(0,a.jsx)(n.a,{href:"/playground/#PTAEBUAsFNQMwPYBskIO4EsB2BzUTtYATBaAZywHIAXUE0AQywE9rJs8AnaBlZgGlCcGbaJ1AZa1aCjIAoEKFERmAB2gBlAMacMq2qqQNmOTggCuWIksgibGMqDI69tMpAtJrAI1jQAbrzmItDWDI4MoFgIRNAAVo7OuvoAdHIYALaqCJy0AN4AvvBmGaCU0bEAXHBklHLpWTm0WgTFCKWULRgAtIicONCUANz1WghYZLQZzADCADIAkqAAvKBdABSU0Fj+3Qj6GOO1AJRyoKApYxkZTESbMCgIlIJ5Z+eg3uYYXmKVoOsMfpkY4rAB8b3ejCBEMhF321EOWE2WAYGUGLxhsKUamgf0ok10uGemNhsSSrkReKgsBRaKUCCcxlAD1Q9OJWMh3AAjl9uEQ-tROOZoPwSecCqcOXCDuNNqZoNAEUSMVLztQcXiCRx2arFAAFMz+DBEDiMJyC03UBkAA22-mtzLEsF4qDQjmU1tp0Ad8MRYveiitH1g3AY1jgJUYWFAdowZiwaKwtECugY3iQ0BSEBgMZ2cfGieTgIwaYz-vOigA1tBmBJ3cIJn00dYg+ZVOpxBQGNW1uFMzGUjg0qrQIpuqBPajvaBuqCJwA5ACCAFkAKLW8ujsDj63TADyMqwDtnE+XAE0APp7vXgBZ7+cbkdjhcr9czufWpdrx+64CbxQLHAZqqNwcAYAAHnWoAgQgRqxNYRqRJEqiAtstDWikdrrMcDpaC6gjKCB0BgeB-5gJgKDBow7YEKEjrcIwjhoDISBZhoipKngto7A6QZwLwZCwBRSB0A4pbQGRuZGvGhagCmJbpiGPAmrg8A5PYji+uMggBNsEhARhWE4aAaDhJJeEoHR4w2LAKHcEmoDzAsw6qnaeIAOIAEqrqut7zu5OpYhKoqQrYVgZpwfwAkCILLHOrxYmMEzIJmqA4Os1oABIsQgggACR5ICOBkCkXoFAAhNaxwjJCBQhaAEpvABOwIJWpqYTs2G5uJjihipeBFeYhaOBG7RSfmCZoXJxY9S5ijUlJoDVrWDgfH21jWcoWnRl6WaZkOoAAGLqVth5lF6zxRkQTVgMoTlRFOZR2nsh61AROaxjJU3yeJJmeD4sCrvOABqV43ne84aBeX6ri5HX+NhIxyACZDMFgWj-LF8VvAwpmSKA0xOSkfQDIjcgSmTQA",children:"View on TypeScript Playground"})}),"\n",(0,a.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"ENV_OPTIONS_NAME=sir ENV_OPTIONS_GREETING=hello node ./env-options.js hello\n"})}),"\n",(0,a.jsxs)(n.blockquote,{children:["\n",(0,a.jsx)(n.p,{children:"These examples are ran as e2e tests on pull-requests and releases to verify they are accurate and up to date. If you see any issues, please open an issue on the github repo."}),"\n"]})]})}function d(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},43023:(e,n,o)=>{o.d(n,{R:()=>r,x:()=>s});var a=o(63696);const t={},i=a.createContext(t);function r(e){const n=a.useContext(i);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:r(e.components),a.createElement(i.Provider,{value:n},e.children)}}}]);