"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[9190],{96913:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>i,contentTitle:()=>a,default:()=>d,frontMatter:()=>o,metadata:()=>l,toc:()=>c});var s=n(62540),t=n(43023);const o={id:"parser-only",title:"Parser Only",description:"This example demonstrates how to use [@cli-forge/parser](https://npmjs.com/@cli-forge/parser) to interpret CLI arguments\nwithout the need for a CLI framework. For single-command CLIs, this may be enough.\n",hide_title:!0},a="Parser Only",l={id:"examples/parser-only",title:"Parser Only",description:"This example demonstrates how to use [@cli-forge/parser](https://npmjs.com/@cli-forge/parser) to interpret CLI arguments\nwithout the need for a CLI framework. For single-command CLIs, this may be enough.\n",source:"@site/docs/examples/parser-only.md",sourceDirName:"examples",slug:"/examples/parser-only",permalink:"/cli-forge/examples/parser-only",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{id:"parser-only",title:"Parser Only",description:"This example demonstrates how to use [@cli-forge/parser](https://npmjs.com/@cli-forge/parser) to interpret CLI arguments\nwithout the need for a CLI framework. For single-command CLIs, this may be enough.\n",hide_title:!0},sidebar:"tutorialSidebar",previous:{title:"Option Groups",permalink:"/cli-forge/examples/option-groups"},next:{title:"Using the Test Harness",permalink:"/cli-forge/examples/test-harness"}},i={},c=[{value:"Code",id:"code",level:2},{value:"Usage",id:"usage",level:2}];function p(e){const r={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",pre:"pre",...(0,t.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(r.header,{children:(0,s.jsx)(r.h1,{id:"parser-only",children:"Parser Only"})}),"\n",(0,s.jsxs)(r.p,{children:["This example demonstrates how to use ",(0,s.jsx)(r.a,{href:"https://npmjs.com/@cli-forge/parser",children:"@cli-forge/parser"})," to interpret CLI arguments\nwithout the need for a CLI framework. For single-command CLIs, this may be enough."]}),"\n",(0,s.jsx)(r.h2,{id:"code",children:"Code"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",metastring:'title="Parser Only" showLineNumbers',children:"import { parser } from '@cli-forge/parser';\n\nconst argv = parser()\n  .option('name', {\n    type: 'string',\n    description: 'The name to say hello to',\n    default: 'World',\n  })\n  .parse(process.argv.slice(2));\n\nconsole.log(`Hello, ${argv.name}!`);\n\n"})}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"/playground/#PTAEBUAsFNQMwPYBskIO4EsB2BzUTtYATBaAZywHIAXUE0AQywE9rJs8AnaBlZgGlCcGbaJ1AZa1aCjIAoEKFERmAB2gBlAMacMq2qqQNmOTggCuWIksgibGMqDI69tMpAtJrAI1jQAbrzmItDWDI4MoFgIRNAAVo7OuvoAdHIYALaqCJy0AN4AvvBmGaCU0bEAXHBklHLpWTn5oKoMnGRioEVwJWUAAloEALSInDjQwK3tYpQA3PVaCFhktG04-qAAvC1tHZwAFACUcqCgKQj6GEv75QwZ0JSCeSenSmrQlWUruriPL6exJKuK5YT6UKCwLB3WDUBBOYygGAoOGwv6vOjQOAMcxIahggDqOS8aK6x1OKSmHX2qjMWnIZBSa38KTIBDp+wATIdDvM5ItlshoClUDh9gADAASMlQggAJHkmSkofcCgBCMU8uRAA",children:"View on TypeScript Playground"})}),"\n",(0,s.jsx)(r.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-shell",children:"node ./parser-only.js --name sir\n"})}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsx)(r.p,{children:"These examples are ran as e2e tests on pull-requests and releases to verify they are accurate and up to date. If you see any issues, please open an issue on the github repo."}),"\n"]})]})}function d(e={}){const{wrapper:r}={...(0,t.R)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(p,{...e})}):p(e)}},43023:(e,r,n)=>{n.d(r,{R:()=>a,x:()=>l});var s=n(63696);const t={},o=s.createContext(t);function a(e){const r=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function l(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:a(e.components),s.createElement(o.Provider,{value:r},e.children)}}}]);