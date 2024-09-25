"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[2345],{76075:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>o,default:()=>d,frontMatter:()=>r,metadata:()=>i,toc:()=>l});var a=n(62540),s=n(43023);const r={id:"arguments-of",title:"Arguments Of",description:"When building a CLI, and especially if taking advantage of [composition](./composable-options), it can be necessary to have a typescript type that respresents the resolved arguments of a CLI command. For example, if you abstract the handler of a command into a separate function, the argument of that function would be typed as the arguments of the CLI command.\n\nCLI Forge provides the `ArgumentsOf` type to help with this. It takes a CLI instance or a function that returns a CLI instance and returns the type of the arguments that the CLI command handler will receive. There are some difficulties with typescript support for circular references, so its usage isn't perfect, but if used with composable builders directly you avoid these problems.\n",hide_title:!0},o="Arguments Of",i={id:"examples/arguments-of",title:"Arguments Of",description:"When building a CLI, and especially if taking advantage of [composition](./composable-options), it can be necessary to have a typescript type that respresents the resolved arguments of a CLI command. For example, if you abstract the handler of a command into a separate function, the argument of that function would be typed as the arguments of the CLI command.\n\nCLI Forge provides the `ArgumentsOf` type to help with this. It takes a CLI instance or a function that returns a CLI instance and returns the type of the arguments that the CLI command handler will receive. There are some difficulties with typescript support for circular references, so its usage isn't perfect, but if used with composable builders directly you avoid these problems.\n",source:"@site/docs/examples/arguments-of.md",sourceDirName:"examples",slug:"/examples/arguments-of",permalink:"/cli-forge/examples/arguments-of",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{id:"arguments-of",title:"Arguments Of",description:"When building a CLI, and especially if taking advantage of [composition](./composable-options), it can be necessary to have a typescript type that respresents the resolved arguments of a CLI command. For example, if you abstract the handler of a command into a separate function, the argument of that function would be typed as the arguments of the CLI command.\n\nCLI Forge provides the `ArgumentsOf` type to help with this. It takes a CLI instance or a function that returns a CLI instance and returns the type of the arguments that the CLI command handler will receive. There are some difficulties with typescript support for circular references, so its usage isn't perfect, but if used with composable builders directly you avoid these problems.\n",hide_title:!0},sidebar:"tutorialSidebar",previous:{title:"Examples",permalink:"/cli-forge/examples/"},next:{title:"Basic CLI",permalink:"/cli-forge/examples/basic-cli"}},c={},l=[{value:"Code",id:"code",level:2},{value:"Usage",id:"usage",level:2}];function u(e){const t={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.header,{children:(0,a.jsx)(t.h1,{id:"arguments-of",children:"Arguments Of"})}),"\n",(0,a.jsxs)(t.p,{children:["When building a CLI, and especially if taking advantage of ",(0,a.jsx)(t.a,{href:"./composable-options",children:"composition"}),", it can be necessary to have a typescript type that respresents the resolved arguments of a CLI command. For example, if you abstract the handler of a command into a separate function, the argument of that function would be typed as the arguments of the CLI command."]}),"\n",(0,a.jsxs)(t.p,{children:["CLI Forge provides the ",(0,a.jsx)(t.code,{children:"ArgumentsOf"})," type to help with this. It takes a CLI instance or a function that returns a CLI instance and returns the type of the arguments that the CLI command handler will receive. There are some difficulties with typescript support for circular references, so its usage isn't perfect, but if used with composable builders directly you avoid these problems."]}),"\n",(0,a.jsx)(t.h2,{id:"code",children:"Code"}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",metastring:'title="Arguments Of" showLineNumbers',children:"import { cli, ArgumentsOf, makeComposableBuilder, chain, CLI } from 'cli-forge';\n\nconst withName = makeComposableBuilder((args) =>\n  args.option('name', {\n    type: 'string',\n    description: 'Your name',\n    required: true,\n  })\n);\n\nconst withAge = makeComposableBuilder((args) =>\n  args.option('age', {\n    type: 'number',\n    description: 'Your age',\n    required: true,\n  })\n);\n\nconst builder = <T extends CLI>(args: T) => chain(args, withName, withAge);\n\nconst myCLI = cli('arguments-of', {\n  builder: (args) => builder(args),\n  handler: (args) => CLIHandler(args),\n});\n\ntype Arguments = ArgumentsOf<typeof builder>;\n\nfunction CLIHandler(args: Arguments) {\n  console.log(`Hello, ${args.name}!`);\n  console.log(`You are ${args.age.toFixed(0)} years old.`);\n}\n\nif (require.main === module) {\n  (async () => {\n    await myCLI.forge();\n  })();\n}\n\n"})}),"\n",(0,a.jsx)(t.p,{children:(0,a.jsx)(t.a,{href:"/playground/#PTAEBUAsFNQMwPYBskIO4EsB2BzUTtYATBaAZywHIAXUE0AQywE9rJs8AnaBlZgGlCcGbaJ1AZa1aCjIAoEKFERmAB2gBlAMacMq2qqQNmOTggCuWIksgibGMqDI69tMpAtJrAI1jQAbrzmItDWDI4MoFgIRNAAVo7OuvoAdHIYALaqCJy0AN4AvvBmGaCU0bEAXHBklHLpWTn5oFoEggCCnDjmGdBY1GQA8nCCGQwA1tAAwgiNZAzeSNAAQuYYXmKCWrbYglMAMgCSoEVwJWWtGAC0iF3QlADc9VoIWGS0mGwAcgy9oAC8oDGkxmcwWS1W61inAAFDCGF0yABKAEAPjkoEYiJSCH0GFeMPKv3ugjyGMxSjU0EqZXeulwlH45MxsSSrnxWBplAAmhZxFhiYzmUJoABHNbcIg06icczQJmYgpIuRIp5yF5vD6SSDtHCwQHA6azbLzRYrNYbWHwxEo-7ozEInBkHF4gmUBh6xmgMkUynqLlYHq+ThC32slyuzllXnmcQeknC7jijCS6Wy+XkpUqtUa96gbwW6EA0AAHnAoGgAA9pFZHAdDqjrU6aeBbaiWjssE2yIJPpAfr1e9rddBVc9XnmMsx68XLoTHT0+gMrgg4F6ffnC2Iad225uoWJdwrQLYrEtODvHci0aB6wAJJhEc9HuRKtXUKmgTrdXr9RyA79Fz-YYSw-dRV33S1UTVOBLC0agOVvI4HzPQ8rxpQDfwGFEN1zZBoBSVAcBhAADO8ZFQQQABI8ivFIBV6AoAEISLHTE8KWQiEGIkiYyxWAaLo+MUmoBAADEMErUIYQABiRIpmB4ThHGQIgUlYp4CnqDA4FAGEkwlAixmwAF-gNGJzCWHDyXhMhmCwLQ9L3DcHTQBhJCBacjhSW49RhNiTiRfzNLkIA",children:"View on TypeScript Playground"})}),"\n",(0,a.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-shell",children:"node ./arguments-of.js --name John --age 42\n"})}),"\n",(0,a.jsxs)(t.blockquote,{children:["\n",(0,a.jsx)(t.p,{children:"These examples are ran as e2e tests on pull-requests and releases to verify they are accurate and up to date. If you see any issues, please open an issue on the github repo."}),"\n"]})]})}function d(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(u,{...e})}):u(e)}},43023:(e,t,n)=>{n.d(t,{R:()=>o,x:()=>i});var a=n(63696);const s={},r=a.createContext(s);function o(e){const t=a.useContext(r);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function i(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),a.createElement(r.Provider,{value:t},e.children)}}}]);