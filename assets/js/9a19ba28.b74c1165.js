"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[9902],{35486:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>l,contentTitle:()=>t,default:()=>h,frontMatter:()=>s,metadata:()=>a,toc:()=>c});var i=r(62540),o=r(43023);const s={},t="Type Alias: ConfigurationProvider<T>",a={id:"api/parser/namespaces/ConfigurationFiles/type-aliases/ConfigurationProvider",title:"Type Alias: ConfigurationProvider\\<T\\>",description:"ConfigurationProvider\\: object",source:"@site/docs/api/parser/namespaces/ConfigurationFiles/type-aliases/ConfigurationProvider.md",sourceDirName:"api/parser/namespaces/ConfigurationFiles/type-aliases",slug:"/api/parser/namespaces/ConfigurationFiles/type-aliases/ConfigurationProvider",permalink:"/cli-forge/api/parser/namespaces/ConfigurationFiles/type-aliases/ConfigurationProvider",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Function: resolveConfiguration()",permalink:"/cli-forge/api/parser/namespaces/ConfigurationFiles/functions/resolveConfiguration"},next:{title:"Type Alias: ArrayOptionConfig\\<TCoerce, TChoices\\>",permalink:"/cli-forge/api/parser/type-aliases/ArrayOptionConfig"}},l={},c=[{value:"Type Parameters",id:"type-parameters",level:2},{value:"Type declaration",id:"type-declaration",level:2},{value:"load()",id:"load",level:3},{value:"Parameters",id:"parameters",level:4},{value:"Returns",id:"returns",level:4},{value:"resolve()",id:"resolve",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns-1",level:4},{value:"Defined in",id:"defined-in",level:2}];function d(e){const n={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",p:"p",strong:"strong",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.header,{children:(0,i.jsx)(n.h1,{id:"type-alias-configurationprovidert",children:"Type Alias: ConfigurationProvider<T>"})}),"\n",(0,i.jsxs)(n.blockquote,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"ConfigurationProvider"}),"<",(0,i.jsx)(n.code,{children:"T"}),">: ",(0,i.jsx)(n.code,{children:"object"})]}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"Implement this type to create a custom configuration provider."}),"\n",(0,i.jsx)(n.h2,{id:"type-parameters",children:"Type Parameters"}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"T"})]}),"\n",(0,i.jsx)(n.h2,{id:"type-declaration",children:"Type declaration"}),"\n",(0,i.jsx)(n.h3,{id:"load",children:"load()"}),"\n",(0,i.jsxs)(n.blockquote,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"load"}),": (",(0,i.jsx)(n.code,{children:"filename"}),") => ",(0,i.jsx)(n.code,{children:"T"})," & ",(0,i.jsx)(n.code,{children:"object"})]}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"A function that loads the configuration from the given file."}),"\n",(0,i.jsx)(n.h4,{id:"parameters",children:"Parameters"}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"filename"}),": ",(0,i.jsx)(n.code,{children:"string"})]}),"\n",(0,i.jsx)(n.p,{children:"The path to the configuration file (resolved by ConfigurationProvider#resolve)."}),"\n",(0,i.jsx)(n.h4,{id:"returns",children:"Returns"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"T"})," & ",(0,i.jsx)(n.code,{children:"object"})]}),"\n",(0,i.jsx)(n.p,{children:"The loaded configuration object."}),"\n",(0,i.jsx)(n.h3,{id:"resolve",children:"resolve()"}),"\n",(0,i.jsxs)(n.blockquote,{children:["\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"resolve"}),": (",(0,i.jsx)(n.code,{children:"configurationRoot"}),") => ",(0,i.jsx)(n.code,{children:"string"})," | ",(0,i.jsx)(n.code,{children:"undefined"})]}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"A function that searches for a configuration file in the given directory and returns the path to the file.\nShould handle being passed either a directory to search, or a file to check."}),"\n",(0,i.jsx)(n.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,i.jsxs)(n.p,{children:["\u2022 ",(0,i.jsx)(n.strong,{children:"configurationRoot"}),": ",(0,i.jsx)(n.code,{children:"string"})]}),"\n",(0,i.jsx)(n.h4,{id:"returns-1",children:"Returns"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.code,{children:"string"})," | ",(0,i.jsx)(n.code,{children:"undefined"})]}),"\n",(0,i.jsx)(n.p,{children:"The path to the configuration file, or undefined if no applicable file was found."}),"\n",(0,i.jsx)(n.h2,{id:"defined-in",children:"Defined in"}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/config-files/configuration-loader.ts#L6",children:"packages/parser/src/lib/config-files/configuration-loader.ts:6"})})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},43023:(e,n,r)=>{r.d(n,{R:()=>t,x:()=>a});var i=r(63696);const o={},s=i.createContext(o);function t(e){const n=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:t(e.components),i.createElement(s.Provider,{value:n},e.children)}}}]);