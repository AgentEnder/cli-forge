"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[3540],{23102:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>u,frontMatter:()=>r,metadata:()=>a,toc:()=>d});var o=n(62540),i=n(43023);const r={},s="Autogenerate CLI Documentation",a={id:"guides/generate-docs",title:"Autogenerate CLI Documentation",description:"Any CLI that is written with CLI forge can utilize npx cli-forge generate-docs to generate documentation.",source:"@site/docs/guides/generate-docs.md",sourceDirName:"guides",slug:"/guides/generate-docs",permalink:"/cli-forge/guides/generate-docs",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Contributing",permalink:"/cli-forge/contributing"},next:{title:"Getting Started with CLI Forge",permalink:"/cli-forge/guides/quick-start"}},c={},d=[{value:"Enabling Documentation Generation",id:"enabling-documentation-generation",level:2},{value:"Customizing Output",id:"customizing-output",level:2},{value:"TypeScript Support",id:"typescript-support",level:2}];function l(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.header,{children:(0,o.jsx)(t.h1,{id:"autogenerate-cli-documentation",children:"Autogenerate CLI Documentation"})}),"\n",(0,o.jsxs)(t.p,{children:["Any CLI that is written with CLI forge can utilize ",(0,o.jsx)(t.code,{children:"npx cli-forge generate-docs"})," to generate documentation."]}),"\n",(0,o.jsx)(t.p,{children:"By default, the command will generate documentation for your CLI in markdown. The templates for the markdown are not customizable."}),"\n",(0,o.jsxs)(t.p,{children:["For an example of what this generated documentation looks like, see the ",(0,o.jsx)(t.a,{href:"/cli/",children:"CLI section of the docs"}),"."]}),"\n",(0,o.jsx)(t.h2,{id:"enabling-documentation-generation",children:"Enabling Documentation Generation"}),"\n",(0,o.jsx)(t.p,{children:"As mentioned, all CLIs that utilize CLI Forge can generate documentation. There are two conditions for this to work:"}),"\n",(0,o.jsxs)(t.ul,{children:["\n",(0,o.jsxs)(t.li,{children:["\n",(0,o.jsxs)(t.p,{children:["Your CLI instance itself must be exported from the file that you pass to ",(0,o.jsx)(t.code,{children:"cli-forge generate-docs"}),"."]}),"\n",(0,o.jsx)(t.p,{children:"While this isn't needed for the CLI to function, its needed for CLI Forge's CLI to be able to get access to the internal structure of your CLI."}),"\n"]}),"\n",(0,o.jsxs)(t.li,{children:["\n",(0,o.jsxs)(t.p,{children:["If generating markdown, the ",(0,o.jsx)(t.code,{children:"markdown-factory"})," package must be installed in your project."]}),"\n",(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.code,{children:"markdown-factory"})," is an optional peer dependency of CLI Forge, so you may need to install it yourself. If you created your CLI with ",(0,o.jsx)(t.code,{children:"npx cli-forge init"}),", it will be installed for you. If not, it should be installed as a dev dependency as your CLI will not depend on it at runtime. ",(0,o.jsx)(t.code,{children:"markdown-factory"})," is used to render the dynamic markdown templates that CLI Forge uses to generate documentation."]}),"\n"]}),"\n"]}),"\n",(0,o.jsx)(t.h2,{id:"customizing-output",children:"Customizing Output"}),"\n",(0,o.jsxs)(t.p,{children:["Even though the templates are not directly customizable, you can still customize the output of the documentation by using the ",(0,o.jsx)(t.code,{children:"--format"})," flag. This flag allows you to generate json output instead of markdown, which you can then use to generate your own documentation."]}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:"language-sh",children:"npx cli-forge generate-docs ./bin/{my-cli}.js --format json\n"})}),"\n",(0,o.jsx)(t.p,{children:"The json output is the raw data structure that is used when generating the markdown documentation, so it should contain all the information you need to generate your own documentation."}),"\n",(0,o.jsx)(t.h2,{id:"typescript-support",children:"TypeScript Support"}),"\n",(0,o.jsxs)(t.p,{children:["If your CLI is written in TypeScript, CLI Forge will use ",(0,o.jsx)(t.a,{href:"https://npmjs.com/tsx",children:(0,o.jsx)(t.code,{children:"tsx"})})," to import the typescript files without needing to compile them first. ",(0,o.jsx)(t.code,{children:"tsx"})," is an optional peer dependency of CLI Forge, so you may need to install it yourself. If you created your CLI with ",(0,o.jsx)(t.code,{children:"npx cli-forge init"}),", it will be installed for you. If not, it should be installed as a dev dependency as your CLI will not depend on it at runtime."]}),"\n",(0,o.jsxs)(t.p,{children:["The documentation itself will not be change if you decide to point to the typescript source file or the compiled javascript file. Given this, if you wish to avoid the overhead of using ",(0,o.jsx)(t.code,{children:"tsx"}),", you can compile your typescript files first and then point to the compiled javascript file when generating documentation."]})]})}function u(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},43023:(e,t,n)=>{n.d(t,{R:()=>s,x:()=>a});var o=n(63696);const i={},r=o.createContext(i);function s(e){const t=o.useContext(r);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:s(e.components),o.createElement(r.Provider,{value:t},e.children)}}}]);