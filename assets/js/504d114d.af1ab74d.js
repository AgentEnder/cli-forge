"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[1642],{71296:(e,s,t)=>{t.r(s),t.d(s,{assets:()=>l,contentTitle:()=>o,default:()=>d,frontMatter:()=>r,metadata:()=>i,toc:()=>c});var n=t(62540),a=t(43023);const r={id:"test-harness",title:"Using the Test Harness",description:"This is a simple example that demonstrates how to create a basic CLI using cli-forge\n",hide_title:!0},o="Using the Test Harness",i={id:"examples/test-harness",title:"Using the Test Harness",description:"This is a simple example that demonstrates how to create a basic CLI using cli-forge\n",source:"@site/docs/examples/test-harness.md",sourceDirName:"examples",slug:"/examples/test-harness",permalink:"/cli-forge/examples/test-harness",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{id:"test-harness",title:"Using the Test Harness",description:"This is a simple example that demonstrates how to create a basic CLI using cli-forge\n",hide_title:!0},sidebar:"tutorialSidebar",previous:{title:"Parser Only",permalink:"/cli-forge/examples/parser-only"},next:{title:"cli-forge",permalink:"/cli-forge/api/cli-forge/"}},l={},c=[{value:"Code",id:"code",level:2},{value:"Usage",id:"usage",level:2}];function h(e){const s={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",header:"header",p:"p",pre:"pre",...(0,a.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(s.header,{children:(0,n.jsx)(s.h1,{id:"using-the-test-harness",children:"Using the Test Harness"})}),"\n",(0,n.jsx)(s.p,{children:"This is a simple example that demonstrates how to create a basic CLI using cli-forge"}),"\n",(0,n.jsx)(s.h2,{id:"code",children:"Code"}),"\n",(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-ts",metastring:'title="Using the Test Harness" showLineNumbers',children:"import { describe, it } from 'node:test';\nimport * as assert from 'node:assert';\n\n// We can reuse the CLI from the basic-cli example\nimport cli from './basic-cli';\nimport { TestHarness } from 'cli-forge';\n\ndescribe('Basic CLI', () => {\n  it('should parse the hello command', async () => {\n    // The TestHarness is used to simulate CLI invocations, without actually running the commands.\n    // If you want to test how the CLI is parsing arguments, you can use the TestHarness.\n    // If you actually want to test the CLI handlers, you should extract the handler logic\n    // to a separate function and test that function directly.\n    const harness = new TestHarness(cli);\n\n    // The parse method returns the parsed arguments and the command chain that was resolved.\n    // The command chain contains each command that was resolved during parsing. If its empty,\n    // then the root command was resolved. If it contains ['hello'], then the hello command was resolved.\n    const { args, commandChain } = await harness.parse([\n      'hello',\n      '--name',\n      'sir',\n    ]);\n\n    assert.deepStrictEqual(commandChain, ['hello']);\n    assert.deepStrictEqual(args, { name: 'sir', unmatched: [] });\n  });\n});\n\n"})}),"\n",(0,n.jsx)(s.p,{children:(0,n.jsx)(s.a,{href:"/playground/#PTAEBUAsFNQMwPYBskIO4EsB2BzUTtYATBaAZywHIAXUE0AQywE9rJs8AnaBlZgGlCcGbaJ1AZa1aCjIAoEKFERmAB2gBlAMacMq2qqQNmOTggCuWIksgibGMqDI69tMpAtJrAI1jQAbrzmItDWDI4MoFgIRNAAVo7OuvoAdHIYALaqCJy0AN4AvvBmGaCU0bEAXHBklHLpWTn5dOQuvoKSoEVwJWUV0JXSZNSUANwN2bmgAFSMEWRkYrQ9CKXlMQPhi7lj9YoA6rBaTELQ5os2sADCADIAksWrl6De4RhaALRaBKDQAB4MLJIaATJqgb4YR5rFLAV5kd5fAi7TKTZrgcjUAASDE4WHIjm6vUoEI+iE4OGguzksSSGF8AApKAAhN5aUC3O6UQT0gCUoAAvAA+UB5OSgCTURnuTzWVQ4i7KGAoBDg1YZJhELlzZhYNm8gXC0Xi8WKKCwdHDbG4-ESRznUJKFXwjLmIzSdn3CRYfwIY7UDAILBkQSYNgWWgMLTUYJ8ISWLAcZ5aNUashpY2gRR3OCgZgWUBoJhSFVDWgeNDPDm20Byzjw3CMcnmDLQLDUYO5-PHLCge3PC1YnF4hbp41ZnN58yMKMxpDMAtFx1KDGVz22KzAuuCSdODyu6z-ajCKPPddETf4BA4d5isdgagqyKLWsheCWKMBnsa5fDGx2ODvv6gZ0Bg3BRnOo7ismQZlkONr8lE0AVgOVrDmQ9IQjy4y3iaYBmjW8qwC2YbWNw0a4o4yi1osYRNi2bYRFYSYpkxWi2Ngf60IWjjcGQyD+KEkGZnhMCqhk6qsexPbQdQDDYI4PBsWJEnWGwdjcacfFIAJ1hEOYugNtRHApKA2YSgpWTUAIOHCZcPbKGYCC0Mm4nfhpvH8YJpk5p0MlyUGoAANqUEqqCUAAuoIoj2aJoUqi5KkLjx5CeUQQnQb+eSNjgHYJRqVxSV0AqMIWnS2NaI7UdA9KBTZ4ohTIYX8HVZQfB8WCApSzUZvV8KcFyNnhVh9QZlsSwpLE0CqBoR7vNQACiACOMYYSxRAFf5gjBXFEXDaNCzjZN02zVGS0rTiOWCFlHUtpUZR9VqljqtQbGhHdgXhV0e1feMBTDUAA",children:"View on TypeScript Playground"})}),"\n",(0,n.jsx)(s.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-shell",children:"node --test ./test-harness.js\n"})}),"\n",(0,n.jsxs)(s.blockquote,{children:["\n",(0,n.jsx)(s.p,{children:"These examples are ran as e2e tests on pull-requests and releases to verify they are accurate and up to date. If you see any issues, please open an issue on the github repo."}),"\n"]})]})}function d(e={}){const{wrapper:s}={...(0,a.R)(),...e.components};return s?(0,n.jsx)(s,{...e,children:(0,n.jsx)(h,{...e})}):h(e)}},43023:(e,s,t)=>{t.d(s,{R:()=>o,x:()=>i});var n=t(63696);const a={},r=n.createContext(a);function o(e){const s=n.useContext(r);return n.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function i(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:o(e.components),n.createElement(r.Provider,{value:s},e.children)}}}]);