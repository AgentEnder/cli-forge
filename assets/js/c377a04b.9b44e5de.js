"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[3361],{87445:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>M,contentTitle:()=>a,default:()=>c,frontMatter:()=>t,metadata:()=>g,toc:()=>l});var s=i(62540),o=i(43023);const t={id:"index",title:"Home",hide_title:!0,slug:"/",sidebar_position:1},a="CLI Forge",g={id:"index",title:"Home",description:"CLI Forge Logo",source:"@site/docs/index.md",sourceDirName:".",slug:"/",permalink:"/cli-forge/",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{id:"index",title:"Home",hide_title:!0,slug:"/",sidebar_position:1},sidebar:"tutorialSidebar",next:{title:"Changelog",permalink:"/cli-forge/changelog"}},M={},l=[{value:"Features",id:"features",level:2},{value:"Quick Start",id:"quick-start",level:2},{value:"Manual Installation",id:"manual-installation",level:2},{value:"Usage",id:"usage",level:2},{value:"Basic Example",id:"basic-example",level:3},{value:"Subshells",id:"subshells",level:2},{value:"Generating Documentation",id:"generating-documentation",level:2},{value:"Why not yargs, commander, or vorpal?",id:"why-not-yargs-commander-or-vorpal",level:2},{value:"Contributing",id:"contributing",level:2}];function r(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",img:"img",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,o.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.p,{children:(0,s.jsx)(n.img,{alt:"CLI Forge Logo",src:i(48787).A+"",width:"650",height:"520"})}),"\n",(0,s.jsx)(n.header,{children:(0,s.jsx)(n.h1,{id:"cli-forge",children:"CLI Forge"})}),"\n",(0,s.jsxs)(n.p,{children:["\u2728 Proudly built with ",(0,s.jsx)(n.a,{href:"https://nx.dev",children:"Nx"})," \u2728."]}),"\n",(0,s.jsxs)(n.p,{children:["CLI Forge is a library / framework for building command line interfaces (CLI) in Node.js, inspired by projects like ",(0,s.jsx)(n.a,{href:"https://yargs.js.org/",children:"yargs"}),", ",(0,s.jsx)(n.a,{href:"https://www.npmjs.com/package/commander",children:"commander"}),", and ",(0,s.jsx)(n.a,{href:"https://vorpal.js.org/",children:"vorpal"}),"."]}),"\n",(0,s.jsx)(n.h2,{id:"features",children:"Features"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Full option parsing, with support for flags and positional arguments."}),"\n",(0,s.jsx)(n.li,{children:"TypeScript first, with full type support for parsed arguments."}),"\n",(0,s.jsx)(n.li,{children:"Command and subcommand support."}),"\n",(0,s.jsx)(n.li,{children:"Subshell support to make running complex subcommands easier."}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"--help"})," and documentation generation."]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"quick-start",children:"Quick Start"}),"\n",(0,s.jsx)(n.p,{children:"To create a new CLI, simply run:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"npx cli-forge init my-cli\n"})}),"\n",(0,s.jsx)(n.h2,{id:"manual-installation",children:"Manual Installation"}),"\n",(0,s.jsx)(n.p,{children:"To install the full command library, run:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"npm install cli-forge\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Then, create a new file (e.g. ",(0,s.jsx)(n.code,{children:"my-cli.ts"}),"), and add the following code:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-js",children:"import { cli } from 'cli-forge';\n\ncli('my-cli')\n  .command('hello', {\n    description: 'Say hello to the world',\n    builder: (args) =>\n      args.option('name', {\n        type: 'string',\n        description: 'The name to say hello to',\n      }),\n    handler: (args) => {\n      console.log(`Hello, ${args.name}!`);\n    },\n  })\n  .forge();\n"})}),"\n",(0,s.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsxs)(n.p,{children:["See docs for more examples: ",(0,s.jsx)(n.a,{href:"https://craigory.dev/cli-forge/examples",children:"https://craigory.dev/cli-forge/examples"})]}),"\n",(0,s.jsx)(n.h3,{id:"basic-example",children:"Basic Example"}),"\n",(0,s.jsxs)(n.p,{children:["To create a new CLI, save the below code to a file (e.g. ",(0,s.jsx)(n.code,{children:"my-cli.js"}),"), and run it with Node.js:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-js",children:"import { cli } from 'cli-forge';\n\ncli('my-cli')\n  .command('hello', {\n    description: 'Say hello to the world',\n    builder: (args) =>\n      args.option('name', {\n        type: 'string',\n        description: 'The name to say hello to',\n      }),\n    handler: (args) => {\n      console.log(`Hello, ${args.name}!`);\n    },\n  })\n  .forge();\n"})}),"\n",(0,s.jsx)(n.p,{children:"Then run the CLI with:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:'node my-cli.js hello --name "World"\n'})}),"\n",(0,s.jsx)(n.p,{children:"Then, to generate documentation for the CLI, run:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"npx cli-forge generate-docs my-cli.js\n"})}),"\n",(0,s.jsxs)(n.p,{children:["This should generate a folder called ",(0,s.jsx)(n.code,{children:"docs"})," containing markdown documentation for the CLI. Alternatively, you can pass ",(0,s.jsx)(n.code,{children:"--format json"})," to generate JSON documentation to further process."]}),"\n",(0,s.jsx)(n.h2,{id:"subshells",children:"Subshells"}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.code,{children:"cli-forge"})," ships with a simplistic subshell to make interactively running commands feel a bit nicer. The subshell is entirely opt-in, and can be enabled by calling ",(0,s.jsx)(n.code,{children:".enableInteractiveShell()"})," on your top level command."]}),"\n",(0,s.jsx)(n.p,{children:"If enabled, running any command that has subcommands without specifying a subcommand will drop you into the subshell. This allows you to run subcommands without having to retype the top level command."}),"\n",(0,s.jsxs)(n.p,{children:["See the ",(0,s.jsx)(n.a,{href:"https://craigory.dev/cli-forge/examples/interactive-subshell",children:"subshell example"})," for more information and a concrete example."]}),"\n",(0,s.jsx)(n.p,{children:"More improvements to the subshell are planned in the future."}),"\n",(0,s.jsx)(n.h2,{id:"generating-documentation",children:"Generating Documentation"}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.code,{children:"cli-forge"})," can generate documentation for your CLI based on the commands and options that you've defined. To generate documentation, run:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"npx cli-forge generate-docs my-cli.{js,ts}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["By default, this will generate markdown documentation in a folder called ",(0,s.jsx)(n.code,{children:"docs"}),". You can also pass ",(0,s.jsx)(n.code,{children:"--format json"})," to generate a JSON object representation of your CLI instead. This is useful as a middle step if you want to generate documentation in a different format, or just a different style of markdown."]}),"\n",(0,s.jsx)(n.h2,{id:"why-not-yargs-commander-or-vorpal",children:"Why not yargs, commander, or vorpal?"}),"\n",(0,s.jsxs)(n.p,{children:["The main goal of ",(0,s.jsx)(n.code,{children:"cli-forge"})," is to provide a simple, type-safe, and easy to use CLI framework for building command line interfaces in Node.js. A strong commitment to TypeScript and type safety is a core part of the project, and the library is designed to be as simple and easy to use as possible. Despite this, you'll note several places that there are type casts or type assertions in the codebase. This is due to limitations in TypeScript's type system, and the library is designed with ",(0,s.jsx)(n.strong,{children:"user"})," type safety taking priority over type safety within the library itself. We still try to avoid type casts where possible, but they are sometimes necessary to make the library easier to use."]}),"\n",(0,s.jsx)(n.p,{children:"You'll note that the API is quite similar to both yargs and commander, and that's by design. I love both of those libraries, and just wanted something a bit more friendly. CLI Forge removes some of the features that seem less necessary, and adds a few features that I've found useful in my own projects. The most notable missing features are:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"Parsing positional options from the usage string."}),"\n",(0,s.jsx)(n.li,{children:"Parsing unknown options."}),"\n",(0,s.jsx)(n.li,{children:"File system based routing / command loading."}),"\n"]}),"\n",(0,s.jsx)(n.p,{children:"In order to keep the library's focus on typescript, parsing options out of the usage string would not be feasible. File system based routing is a cool feature, but I've found it to be a bit of a pain to work with in practice. I may add it in the future, but it's not a priority. Parsing unknown options makes it a lot faster to get started as you don't actually have to describe each option type that you're expecting, but that also eliminates the type safety. There are valid use cases for capturing options that you don't know about, but I've found that in practice, you usually wouldn't want to parse them as you will be passing them to another command or process and not want to modify them."}),"\n",(0,s.jsxs)(n.p,{children:["Vorpal can do ",(0,s.jsx)(n.strong,{children:"a lot"}),". There are some cool features there that may be considered for the future, and the subshell is a nod to vorpal's interactive shell. That being said, vorpal's last release was 7 years ago, and a lot has changed since then. Its still a great tool and a great project though, so I'd still recommend checking it out for some inspiration."]}),"\n",(0,s.jsx)(n.h2,{id:"contributing",children:"Contributing"}),"\n",(0,s.jsxs)(n.p,{children:["Contributions are welcome! Please see the ",(0,s.jsx)(n.a,{href:"/cli-forge/contributing",children:"contributing guide"})," for more information."]})]})}function c(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(r,{...e})}):r(e)}},48787:(e,n,i)=>{i.d(n,{A:()=>s});const s="data:image/svg+xml;base64,PHN2ZwogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA1MCA0MCIKICB2ZXJzaW9uPSIxLjEiCiAgdmlld0JveD0iMCAwIDUwIDQwIgogIGlkPSJzdmdjb250ZW50IgogIG92ZXJmbG93PSJ2aXNpYmxlIgogIHdpZHRoPSI2NTAiCiAgaGVpZ2h0PSI1MjAiCiAgeD0iNjUwIgogIHk9IjUyMCIKPgogIDxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+CiAgICAuc3QwIHsKICAgICAgZmlsbDogI2ZmZmZmZjsKICAgIH0KICAgIC5zdDEgewogICAgICBmaWxsOiAjMTExMTExOwogICAgfQogICAgLnN0MiB7CiAgICAgIGZpbGw6ICNmZmZmZmY7CiAgICAgIHN0cm9rZTogIzAwMDAwMDsKICAgICAgc3Ryb2tlLXdpZHRoOiAyOwogICAgICBzdHJva2UtbWl0ZXJsaW1pdDogMTA7CiAgICB9CiAgICAuc3QzIHsKICAgICAgZmlsbDogI2ZmZmZmZjsKICAgICAgc3Ryb2tlOiAjMDAwMDAwOwogICAgICBzdHJva2UtbWl0ZXJsaW1pdDogMTA7CiAgICB9CiAgICAuc3Q0IHsKICAgICAgZmlsbDogbm9uZTsKICAgICAgc3Ryb2tlOiAjMDAwMDAwOwogICAgICBzdHJva2UtbWl0ZXJsaW1pdDogMTA7CiAgICB9CiAgICAuc3Q1IHsKICAgICAgZmlsbDogbm9uZTsKICAgICAgc3Ryb2tlOiAjMDAwMDAwOwogICAgICBzdHJva2Utd2lkdGg6IDM7CiAgICAgIHN0cm9rZS1saW5lY2FwOiByb3VuZDsKICAgICAgc3Ryb2tlLW1pdGVybGltaXQ6IDEwOwogICAgfQogICAgLnN0NiB7CiAgICAgIGZpbGw6ICNmZmZmZmY7CiAgICAgIHN0cm9rZTogIzAwMDAwMDsKICAgICAgc3Ryb2tlLWxpbmVqb2luOiByb3VuZDsKICAgICAgc3Ryb2tlLW1pdGVybGltaXQ6IDEwOwogICAgfQogIDwvc3R5bGU+CiAgPGcgY2xhc3M9ImxheWVyIiBzdHlsZT0icG9pbnRlci1ldmVudHM6IGFsbCI+CiAgICA8dGl0bGUgc3R5bGU9InBvaW50ZXItZXZlbnRzOiBpbmhlcml0Ij5MYXllciAxPC90aXRsZT4KICAgIDxwYXRoCiAgICAgIGQ9Ik00MSwxOEwxNSwxOEwxNCwxOUwzLDE5UzYsMjMgOSwyNFMxNiwyNSAxNiwyNVMyMCwyNSAyMCwyOFMxNCwzNCAxNCwzNEwxMywzNUwxMywzN0wxOCwzN1MxOSwzNiAyNCwzNlMzMCwzNyAzMCwzN0wzNSwzN0wzNSwzNVMzMi44LDMyLjkgMzEsMzJDMjksMzEgMjksMjggMjksMjhTMzAsMjMgMzYsMjNTNDIsMjIgNDIsMjJMNDIsMjBTNDMsMjAgNDMsMTlTNDMsMTggNDEsMTh6IgogICAgICBpZD0ic3ZnXzMiCiAgICA+PC9wYXRoPgogICAgPGcgaWQ9InN2Z185Ij4KICAgICAgPHJlY3QKICAgICAgICBmaWxsPSIjZmZmZmZmIgogICAgICAgIHN0cm9rZT0ibnVsbCIKICAgICAgICBzdHJva2UtZGFzaGFycmF5PSJudWxsIgogICAgICAgIHN0cm9rZS1saW5lam9pbj0ibnVsbCIKICAgICAgICBzdHJva2UtbGluZWNhcD0ibnVsbCIKICAgICAgICBzdHJva2Utb3BhY2l0eT0ibnVsbCIKICAgICAgICB4PSIzOS4xODk5NzMxNDI4MDg1MyIKICAgICAgICB5PSI3Ljg4MDg1OTM2MjYwMjcxOTUiCiAgICAgICAgd2lkdGg9IjEuOTg5MjkxNjI5ODgwODY1MiIKICAgICAgICBoZWlnaHQ9IjExLjQ1MzMwODcwMjI2MDIzNiIKICAgICAgICBpZD0ic3ZnXzgiCiAgICAgICAgdHJhbnNmb3JtPSJyb3RhdGUoLTU5LjQ0NzYgNDAuMTg0NiAxMy42MDc1KSIKICAgICAgPjwvcmVjdD4KICAgICAgPHBhdGgKICAgICAgICBkPSJNNDQuODQ1NDAxODA3MjI4MjgsMTcuNzYyMjM2MTc1MDAxMDM2IEM0NC40NTkwMzE0NzY3MTI2NSwxNy44NjU3NjM3OTMwNDIwNDIgNDQuMDIwODk3MzM3MTc2NTIsMTcuNzc2MTA2MjQ1ODI1MjM2IDQzLjY3OTM1NTc4MDI2OTMwNCwxNy42NjA1NjY3OTQwOTgxOCBMMzMuMjY5MDI0MzczNDQwNzksMTEuNjUwMTU5MTU0MDEyNTI0IEMzMi45MDE2MDA5MTIwMjMzMSwxMS40MzgwMjcxMTk2NTY1NjIgMzIuNzAxNDgwNzExMzUzNCwxMS4wNzc1Mzg2OTM2NTExODUgMzIuNTk3OTUzMDkzMzEyMzg0LDEwLjY5MTE2ODM2MzEzNTU2IFMzMi41ODQwODMwMjI0ODgxOSw5Ljg2NjY2Mzg5MzA4MzggMzIuNjk5NjIyNDc0MjE1MjQ2LDkuNTI1MTIyMzM2MTc2NTc0IEwzMi44NDEwNDM4MzA0NTI1NSw5LjI4MDE3MzM2MTg5ODI1NyBDMzMuMjY1MzA3ODk5MTY0NDgsOC41NDUzMjY0MzkwNjMzMDQgMzQuMTM0NjQxMTQyODI0NjQsOC4zMTIzODkyOTg0NzEwMzYgMzQuODY5NDg4MDY1NjU5NTk2LDguNzM2NjUzMzY3MTgyOTY0IEw0NS4yNzk4MTk0NzI0ODgxMSwxNC43NDcwNjEwMDcyNjg2MTMgQzQ2LjAxNDY2NjM5NTMyMzA2LDE1LjE3MTMyNTA3NTk4MDU0OCA0Ni4yNDc2MDM1MzU5MTUzMywxNi4wNDA2NTgzMTk2NDA3MSA0NS44MjMzMzk0NjcyMDM0LDE2Ljc3NTUwNTI0MjQ3NTY2MyBMNDUuNjgxOTE4MTEwOTY2MDksMTcuMDIwNDU0MjE2NzUzOTggQzQ1LjU5MjI2MDU2Mzc0OTI4NSwxNy40NTg1ODgzNTYyOTAxMDcgNDUuMjMxNzcyMTM3NzQzOTEsMTcuNjU4NzA4NTU2OTYwMDI2IDQ0Ljg0NTQwMTgwNzIyODI4LDE3Ljc2MjIzNjE3NTAwMTAzNiB6TTM0LjA1ODg1MzY2NjQzMjA0LDkuNTc1MDI3OTA4MDU4OTI0IEMzMy45NjIyNjEwODM4MDMxMzUsOS42MDA5MDk4MTI1NjkxNzggMzMuNzY5MDc1OTE4NTQ1MzI2LDkuNjUyNjczNjIxNTg5NjgxIDMzLjc5NDk1NzgyMzA1NTU3Niw5Ljc0OTI2NjIwNDIxODU4NyBMMzMuNjUzNTM2NDY2ODE4MjcsOS45OTQyMTUxNzg0OTY5MDUgQzMzLjUxMjExNTExMDU4MDk1LDEwLjIzOTE2NDE1Mjc3NTIyNCAzMy41ODk3NjA4MjQxMTE3MSwxMC41Mjg5NDE5MDA2NjE5NDUgMzMuODM0NzA5Nzk4MzkwMDMsMTAuNjcwMzYzMjU2ODk5MjU0IEw0NC4yNDUwNDEyMDUyMTg1MzQsMTYuNjgwNzcwODk2OTg0OTA3IEM0NC40ODk5OTAxNzk0OTY4NiwxNi44MjIxOTIyNTMyMjIyMTYgNDQuNzc5NzY3OTI3MzgzNTc0LDE2Ljc0NDU0NjUzOTY5MTQ2IDQ0LjkyMTE4OTI4MzYyMDg4LDE2LjQ5OTU5NzU2NTQxMzE0MyBMNDUuMDYyNjEwNjM5ODU4MTksMTYuMjU0NjQ4NTkxMTM0ODI4IEM0NS4yMDQwMzE5OTYwOTU1MSwxNi4wMDk2OTk2MTY4NTY1MDUgNDUuMTI2Mzg2MjgyNTY0NzUsMTUuNzE5OTIxODY4OTY5Nzg4IDQ0Ljg4MTQzNzMwODI4NjQzLDE1LjU3ODUwMDUxMjczMjQ3NSBMMzQuNDcxMTA1OTAxNDU3OTIsOS41NjgwOTI4NzI2NDY4MjQgQzM0LjM0ODYzMTQxNDMxODc2LDkuNDk3MzgyMTk0NTI4MTcgMzQuMjUyMDM4ODMxNjg5ODYsOS41MjMyNjQwOTkwMzg0MjEgMzQuMDU4ODUzNjY2NDMyMDQsOS41NzUwMjc5MDgwNTg5MjQgeiIKICAgICAgICBpZD0ic3ZnXzIiCiAgICAgID4KICAgICAgICBDTEkgRm9yZ2UKICAgICAgPC9wYXRoPgogICAgICA8cGF0aAogICAgICAgIGQ9Ik0yOS42NDc2MzExOTY0NTQ1NzIsMTEuMzk2OTE0ODIwMzI0NDY1IEwzMy4xODMxNjUxMDIzODczMDYsNS4yNzMxOTA0NjMzNjY1MTkgQzMzLjY3ODEzOTg0OTIxNzg4NSw0LjQxNTg2OTA1MzM5MjQwOCAzNC44MzcyNTA4NDA3NjQ3Nyw0LjEwNTI4NjE5OTI2OTM4MiAzNS43OTExNjQ4MzMzNjc3OSw0LjU3NDM3OTA0MTU4OTcxNCBMMzcuMzgzMzMzMTY2MTc2ODYsNS40OTM2MTc4NTcxMzIyMjUgQzM4LjI0MDY1NDU3NjE1MDk2Niw1Ljk4ODU5MjYwMzk2MjgwOSAzOC41NTEyMzc0MzAyNzM5OSw3LjE0NzcwMzU5NTUwOTY5MiAzOC4wODIxNDQ1ODc5NTM2NjQsOC4xMDE2MTc1ODgxMTI3MSBMMzQuOTAwMTY0MDcyNjE0MiwxMy42MTI5Njk1MDkzNzQ4NiBDMzQuMTkzMDU3MjkxNDI3NjUsMTQuODM3NzE0MzgwNzY2NDUgMzIuNTUwOTgzMzg2NzM2MjM1LDE1LjI3NzcwNjc1NzQ0MDczNCAzMS4zMjYyMzg1MTUzNDQ2NCwxNC41NzA1OTk5NzYyNTQxODYgTDMwLjM0NjQ0MjYxODIzMTM4LDE0LjAwNDkxNDU1MTMwNDk0OCBDMjkuNDg5MTIxMjA4MjU3MjYsMTMuNTA5OTM5ODA0NDc0MzY1IDI5LjE3ODUzODM1NDEzNDIzNiwxMi4zNTA4Mjg4MTI5Mjc0ODMgMjkuNjQ3NjMxMTk2NDU0NTcyLDExLjM5NjkxNDgyMDMyNDQ2NSB6IgogICAgICAgIGlkPSJzdmdfNCIKICAgICAgPgogICAgICAgIENMSSBGb3JnZQogICAgICA8L3BhdGg+CiAgICA8L2c+CiAgICA8dGV4dAogICAgICBmaWxsPSIjMDAwMDAwIgogICAgICBzdHJva2U9IiNmZmZmZmYiCiAgICAgIHg9Ii04Mi4xNTEzOTg1MDUxMTE0NCIKICAgICAgeT0iMjcuODM3MjcxNTA5ODI2MzMzIgogICAgICBpZD0ic3ZnXzYiCiAgICAgIGZvbnQtc2l6ZT0iMjkiCiAgICAgIGZvbnQtZmFtaWx5PSJNb25vc3BhY2UiCiAgICAgIHRleHQtYW5jaG9yPSJtaWRkbGUiCiAgICAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuMjQxNTgzIDAgMCAwLjIyNzk5MiA0Mi41NzAxIDEyLjQ4MDcpIgogICAgICBmb250LXdlaWdodD0iYm9sZCIKICAgICAgd29yZC1zcGFjaW5nPSIwIgogICAgICBsZXR0ZXItc3BhY2luZz0iMCIKICAgID4KICAgICAgQ0xJIEZvcmdlCiAgICA8L3RleHQ+CiAgPC9nPgo8L3N2Zz4K"},43023:(e,n,i)=>{i.d(n,{R:()=>a,x:()=>g});var s=i(63696);const o={},t=s.createContext(o);function a(e){const n=s.useContext(t);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function g(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:a(e.components),s.createElement(t.Provider,{value:n},e.children)}}}]);