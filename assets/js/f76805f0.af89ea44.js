"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[4575],{52577:(e,a,n)=>{n.r(a),n.d(a,{assets:()=>c,contentTitle:()=>s,default:()=>d,frontMatter:()=>o,metadata:()=>r,toc:()=>h});var i=n(62540),t=n(43023);const o={id:"limit-choices",title:"Option Choices",description:"This is a simple example that demonstrates how to limit choices for a given option.\n\nChoices are checked after `coerce` if it is also provided, so be sure that the `coerce` function returns a value that is in the choices array.\n\nChoices can be provided as an array of valid values or as a function that returns an array of valid values. Note that when returning the array from a function, providing \"as const\" is necessary to narrow the typing of the argument. This may not be possible if the choices are dynamic or need to be calculated at runtime, in which case the typing will remain as a broader type (e.g. `string` instead of `'a' | 'b'`).\n",hide_title:!0},s="Option Choices",r={id:"examples/limit-choices",title:"Option Choices",description:"This is a simple example that demonstrates how to limit choices for a given option.\n\nChoices are checked after `coerce` if it is also provided, so be sure that the `coerce` function returns a value that is in the choices array.\n\nChoices can be provided as an array of valid values or as a function that returns an array of valid values. Note that when returning the array from a function, providing \"as const\" is necessary to narrow the typing of the argument. This may not be possible if the choices are dynamic or need to be calculated at runtime, in which case the typing will remain as a broader type (e.g. `string` instead of `'a' | 'b'`).\n",source:"@site/docs/examples/choices.md",sourceDirName:"examples",slug:"/examples/limit-choices",permalink:"/cli-forge/examples/limit-choices",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{id:"limit-choices",title:"Option Choices",description:"This is a simple example that demonstrates how to limit choices for a given option.\n\nChoices are checked after `coerce` if it is also provided, so be sure that the `coerce` function returns a value that is in the choices array.\n\nChoices can be provided as an array of valid values or as a function that returns an array of valid values. Note that when returning the array from a function, providing \"as const\" is necessary to narrow the typing of the argument. This may not be possible if the choices are dynamic or need to be calculated at runtime, in which case the typing will remain as a broader type (e.g. `string` instead of `'a' | 'b'`).\n",hide_title:!0},sidebar:"tutorialSidebar",previous:{title:"Basic CLI",permalink:"/cli-forge/examples/basic-cli"},next:{title:"Composable Options",permalink:"/cli-forge/examples/composable-options"}},c={},h=[{value:"Code",id:"code",level:2},{value:"Usage",id:"usage",level:2}];function l(e){const a={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",pre:"pre",...(0,t.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(a.header,{children:(0,i.jsx)(a.h1,{id:"option-choices",children:"Option Choices"})}),"\n",(0,i.jsx)(a.p,{children:"This is a simple example that demonstrates how to limit choices for a given option."}),"\n",(0,i.jsxs)(a.p,{children:["Choices are checked after ",(0,i.jsx)(a.code,{children:"coerce"})," if it is also provided, so be sure that the ",(0,i.jsx)(a.code,{children:"coerce"})," function returns a value that is in the choices array."]}),"\n",(0,i.jsxs)(a.p,{children:['Choices can be provided as an array of valid values or as a function that returns an array of valid values. Note that when returning the array from a function, providing "as const" is necessary to narrow the typing of the argument. This may not be possible if the choices are dynamic or need to be calculated at runtime, in which case the typing will remain as a broader type (e.g. ',(0,i.jsx)(a.code,{children:"string"})," instead of ",(0,i.jsx)(a.code,{children:"'a' | 'b'"}),")."]}),"\n",(0,i.jsx)(a.h2,{id:"code",children:"Code"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{className:"language-ts",metastring:'title="Option Choices" showLineNumbers',children:"import cliForge from 'cli-forge';\n\nconst cli = cliForge('basic-cli')\n  .demandCommand()\n  .command('hello', {\n    builder: (args) =>\n      args\n        .option('name', {\n          type: 'string',\n          description: 'The name to say hello to',\n          required: true,\n\n          // Choices limits valid values for the option.\n          // If the provided value is not in the choices array, an error will be thrown.\n          choices: ['sir', 'madame'],\n        })\n        .option('phrase', {\n          type: 'string',\n          default: 'hello',\n\n          // Choices can also be provided as a function that returns an array of valid values.\n          // This can be useful if the choices are dynamic or need to be calculated at runtime.\n          choices: () => ['hello', 'hi', 'hey'],\n        }),\n    // Handler is used to define the command's behavior\n    handler: (args) => {\n      // Note: args.name is typed as 'sir' | 'madame' due to the choices array\n      console.log(`${args.phrase}, ${args.name}!`);\n    },\n  });\n\nexport default cli;\n\nif (require.main === module) {\n  (async () => {\n    await cli.forge();\n  })();\n}\n\n"})}),"\n",(0,i.jsx)(a.p,{children:(0,i.jsx)(a.a,{href:"/playground/#PTAEBUAsFNQMwPYBskIO4EsB2BzUTtYATBaAZywHIAXUE0AQywE9rJs8AnaBlZgGlCcGbaJ1AZa1aCjIAoEKFERmAB2gBlAMacMq2qqQNmOTggCuWIksgibGMqDI69tMpAtJrAI1jQAbrzmItDWDI4MoFgIRNAAVo7OuvoAdHIYALaqCJy0AN4AvvBmGaCU0bEAXHBklHLpWTm0WgQAYjk4sHAlZS0YALSInJ2UANz1WghYZM0EoAC8oH3tw9AAFJTe4Rha-X2UAJRyoKApsRlMRADCCBkXVmtHJymTd5cbMCgIlIJ5xyegbzmDBeMSVUBrBjDMgHBYAPn+AMY0MRSNOCH0GCmGywDAy0B+oD+aLR1DU0HBlBmulwP1RJNiSVcWKwlKgsFx+KUCCcxlAn1Q3LpJKR3AAjsDuERwdROOZoPx6iKAYorh4duR8JlJI5AgRrHr5Y4hjZYBjqCy0sqTooAJJwU2gVRmfwYWIGoKwBxRBC0bCOrTqrSaqHCASMLCgMRmcSYFCA2BsMxoLBW62BhAasjggDaVIwnEJlAuRDxBIAuorlQUniKUuaWRtVJBhGQCb96aTyZTqRxhdbYnAGOYkNRKQLvorO0jVUHNVomIwkGQeb4nS63aFGBF4JYtBapjY7NxqOZONMI8iw6AEA69W7QIbyGnlYooN6F5G1+Y23ARxIHWUDMs2RYhmE5HYb3ELBoC3ahV1gBckC0EcQjCWg5SwC18RfEVgODbMIVheY4VAPMJyLdhKOgZhKEradQBrKsVTAAAJS4kDECRHB-OCeUHQgA1ue4iCpBNbFdHJUVsKxOM4cFIWhYjSOJNFFAAOV9ClkRwMgUk5L1HDJdQwkcfNC1AAAfMoSzLSg6HlbkAznCJODDTtJmmZBoBSVAcDWAADAASPIoV0lJm1baACkEEKwr0gyCgAQgCg5xiRGL-hrcY5GgAAPbJcjoaAhxHWYMByjAHTWcVJR8i5-XmJrQAyGIR2gWFVMhMhwK0Ij4SJVEGDQBhJCWAgUiGTpHnSxiDhmuQCjkIA",children:"View on TypeScript Playground"})}),"\n",(0,i.jsx)(a.h2,{id:"usage",children:"Usage"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{className:"language-shell",children:"node ./limit-choices.js hello --name sir\n"})}),"\n",(0,i.jsxs)(a.blockquote,{children:["\n",(0,i.jsx)(a.p,{children:"These examples are ran as e2e tests on pull-requests and releases to verify they are accurate and up to date. If you see any issues, please open an issue on the github repo."}),"\n"]})]})}function d(e={}){const{wrapper:a}={...(0,t.R)(),...e.components};return a?(0,i.jsx)(a,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},43023:(e,a,n)=>{n.d(a,{R:()=>s,x:()=>r});var i=n(63696);const t={},o=i.createContext(t);function s(e){const a=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(a):{...a,...e}}),[a,e])}function r(e){let a;return a=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:s(e.components),i.createElement(o.Provider,{value:a},e.children)}}}]);