"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[3309],{73591:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>c,contentTitle:()=>a,default:()=>u,frontMatter:()=>o,metadata:()=>l,toc:()=>r});var t=i(62540),s=i(43023);const o={id:"conflicts-and-implications",title:"Conflicts and Implications",description:"This example illustrates how `.conflicts()` and `.implies()` can be used to enforce mutually exclusive options and mutually required options, respectively.\n",hide_title:!0},a="Conflicts and Implications",l={id:"examples/conflicts-and-implications",title:"Conflicts and Implications",description:"This example illustrates how `.conflicts()` and `.implies()` can be used to enforce mutually exclusive options and mutually required options, respectively.\n",source:"@site/docs/examples/conflicts-and-implications.md",sourceDirName:"examples",slug:"/examples/conflicts-and-implications",permalink:"/cli-forge/examples/conflicts-and-implications",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{id:"conflicts-and-implications",title:"Conflicts and Implications",description:"This example illustrates how `.conflicts()` and `.implies()` can be used to enforce mutually exclusive options and mutually required options, respectively.\n",hide_title:!0},sidebar:"tutorialSidebar",previous:{title:"Configuration Files",permalink:"/cli-forge/examples/configuration-files"},next:{title:"Default Values",permalink:"/cli-forge/examples/default-values"}},c={},r=[{value:"Code",id:"code",level:2},{value:"Usage",id:"usage",level:2}];function d(e){const n={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.header,{children:(0,t.jsx)(n.h1,{id:"conflicts-and-implications",children:"Conflicts and Implications"})}),"\n",(0,t.jsxs)(n.p,{children:["This example illustrates how ",(0,t.jsx)(n.code,{children:".conflicts()"})," and ",(0,t.jsx)(n.code,{children:".implies()"})," can be used to enforce mutually exclusive options and mutually required options, respectively."]}),"\n",(0,t.jsx)(n.h2,{id:"code",children:"Code"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",metastring:'title="Conflicts and Implications" showLineNumbers',children:"import cli from 'cli-forge';\n\ncli('conflicts-and-implications', {\n  builder: (args) =>\n    args\n      .option('source', {\n        describe: 'Source database',\n        type: 'string',\n      })\n      .option('target', {\n        describe: 'Target database',\n        type: 'string',\n      })\n      .option('dry-run', {\n        describe: 'Simulate the migration without making changes',\n        type: 'boolean',\n      })\n      .option('force', {\n        describe: 'Force the migration even if there are warnings',\n        type: 'boolean',\n      })\n      .option('backup', {\n        describe: 'Where should the backup be stored',\n        type: 'string',\n      })\n      // Conflicts creates mutually exclusive arguments. Validation will throw an error if both options are provided.\n      // In this case, it makes sense that the user wouldn't want to both simulate and force a migration.\n      .conflicts('dry-run', 'force')\n\n      // Implies creates mutually required arguments. Validation will throw an error if the first argument is provided without the second.\n      // Practically in this case, this means that if the user provides the --force option, they must also provide the --backup option.\n      .implies('force', 'backup'),\n  handler: (args) => {\n    // ...\n  },\n}).forge();\n\n"})}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"/playground/#PTAEBUAsFNQMwPYBskIO4EsB2BzUTtYATBaAZywHIAXUE0AQywE9rJs8AnaBlZgGlCcGbaJ1AZa1aCjIAoEKFERmAB2gBlAMacMq2qqQNmOTggCuWIksgibGMqDI69tMpAtJrAI1jQAbrzmItDWDI4MoFgIRNAAVo7OuvoAdHIYALaqCJy0AN4AvvBmGaCU0bEAXHBklHLpWTm0WgTFCKWULRgAtIicONCUANz1XQAUnQhYcARa1GTdTETdmYYYWiIYU7WCeXKgoN7mGF5ilaBjDP1kAJSgALwAfPsHjNcvr6ApCPpbWBNkCycLSDXYfT50cguXznSgaIEgugiBjecKg8GfahqaCwsjUXS4Sj8DGgAo3EnfX5TCbUK4DahE0B7CGvWJJDAwsrgOnQWhEZGosjolkHLHqXH4jhEklkik-ah-CZETjMbqcSyM5kitnQnFlDSZcxGaQ2WAZDCmTZTUCYNgWWgZBgAaw4oC0tlw5GlIqU2Nh3gQyB4VGJLNlLMpCuplD6IM1JIOOt0nMoADEcojlObLVGsKAAtA8xg4KbuG9YGgrlgODsE77xWUA0GmN6IeGIZHFZRUVoneZVPGfUmOXrKAB1GBl9yeazKHt91SHWB4nKhVsssWjvEEnDr17tz6KADCUxm63mbu4IUcGXM1GCfHzAA8WuYyBh-LA6eYMoX5ilQAANV4DB+VzG0TiQGwzDQRg8zEMxxGLQ4EDYUB5T+CIy1UMx-FA0I0hZRQAEk8zYBw3TRQRJFAR0nXIJxCyFGw7GUN8xBtGcqFoSssCkBAULQ99b2NL8rHgDMv1oi1hFzQiOy0U9ZnmJUVTVDVBBjSTKHJEkSKyAgGJ0HhpBvO8HyQZghGgABHY5uDCfofz-MgAOAggwL+CCUGg9A4PzThEIkEtlDgDBODxN4cGcviJEcHCEDw2JrFtDw71NRjFKseTDzAAAFYQ5nWXhLIkMj2EcDYhUEcib2DRw2DsZC2KFcQEqShjlG6XpJPQqksBqmArNvSLeEBUB2vwjLuvnfs+rkilVkMsgJljUFGwYXt+x00NQA9IgkDOC46VuB5HiZcFFBSa6XgKYkyRSPoBjGG4RiAA",children:"View on TypeScript Playground"})}),"\n",(0,t.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"node ./conflicts-and-implications.js --source=old --target=new\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"node ./conflicts-and-implications.js --source=old --target=new --dry-run\n"})}),"\n",(0,t.jsxs)(n.blockquote,{children:["\n",(0,t.jsx)(n.p,{children:"These examples are ran as e2e tests on pull-requests and releases to verify they are accurate and up to date. If you see any issues, please open an issue on the github repo."}),"\n"]})]})}function u(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},43023:(e,n,i)=>{i.d(n,{R:()=>a,x:()=>l});var t=i(63696);const s={},o=t.createContext(s);function a(e){const n=t.useContext(o);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:a(e.components),t.createElement(o.Provider,{value:n},e.children)}}}]);