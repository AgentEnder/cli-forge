"use strict";(self.webpackChunk_cli_forge_docs_site=self.webpackChunk_cli_forge_docs_site||[]).push([[4176],{79590:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>c,contentTitle:()=>l,default:()=>h,frontMatter:()=>d,metadata:()=>a,toc:()=>o});var s=n(62540),i=n(43023);const d={},l="Class: ArgvParser<TArgs>",a={id:"api/parser/classes/ArgvParser",title:"Class: ArgvParser\\<TArgs\\>",description:"The main parser class. This class is used to configure and parse arguments.",source:"@site/docs/api/parser/classes/ArgvParser.md",sourceDirName:"api/parser/classes",slug:"/api/parser/classes/ArgvParser",permalink:"/cli-forge/api/parser/classes/ArgvParser",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"@cli-forge/parser",permalink:"/cli-forge/api/parser/"},next:{title:"Class: ValidationFailedError\\<T\\>",permalink:"/cli-forge/api/parser/classes/ValidationFailedError"}},c={},o=[{value:"Type Parameters",id:"type-parameters",level:2},{value:"Implements",id:"implements",level:2},{value:"Constructors",id:"constructors",level:2},{value:"new ArgvParser()",id:"new-argvparser",level:3},{value:"Parameters",id:"parameters",level:4},{value:"Returns",id:"returns",level:4},{value:"Defined in",id:"defined-in",level:4},{value:"Properties",id:"properties",level:2},{value:"configuredConflicts",id:"configuredconflicts",level:3},{value:"Defined in",id:"defined-in-1",level:4},{value:"configuredImplies",id:"configuredimplies",level:3},{value:"Defined in",id:"defined-in-2",level:4},{value:"configuredOptions",id:"configuredoptions",level:3},{value:"Implementation of",id:"implementation-of",level:4},{value:"Defined in",id:"defined-in-3",level:4},{value:"configuredPositionals",id:"configuredpositionals",level:3},{value:"Implementation of",id:"implementation-of-1",level:4},{value:"Defined in",id:"defined-in-4",level:4},{value:"options",id:"options",level:3},{value:"Implementation of",id:"implementation-of-2",level:4},{value:"Defined in",id:"defined-in-5",level:4},{value:"parserMap",id:"parsermap",level:3},{value:"Defined in",id:"defined-in-6",level:4},{value:"Methods",id:"methods",level:2},{value:"asReadonly()",id:"asreadonly",level:3},{value:"Returns",id:"returns-1",level:4},{value:"Defined in",id:"defined-in-7",level:4},{value:"augment()",id:"augment",level:3},{value:"Type Parameters",id:"type-parameters-1",level:4},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns-2",level:4},{value:"Defined in",id:"defined-in-8",level:4},{value:"clone()",id:"clone",level:3},{value:"Parameters",id:"parameters-2",level:4},{value:"Returns",id:"returns-3",level:4},{value:"Defined in",id:"defined-in-9",level:4},{value:"config()",id:"config",level:3},{value:"Parameters",id:"parameters-3",level:4},{value:"Returns",id:"returns-4",level:4},{value:"Defined in",id:"defined-in-10",level:4},{value:"conflicts()",id:"conflicts",level:3},{value:"Parameters",id:"parameters-4",level:4},{value:"Returns",id:"returns-5",level:4},{value:"Defined in",id:"defined-in-11",level:4},{value:"env()",id:"env",level:3},{value:"env(envPrefix)",id:"envenvprefix",level:4},{value:"Parameters",id:"parameters-5",level:5},{value:"Returns",id:"returns-6",level:5},{value:"Defined in",id:"defined-in-12",level:5},{value:"env(options)",id:"envoptions",level:4},{value:"Parameters",id:"parameters-6",level:5},{value:"Returns",id:"returns-7",level:5},{value:"Defined in",id:"defined-in-13",level:5},{value:"implies()",id:"implies",level:3},{value:"Parameters",id:"parameters-7",level:4},{value:"Returns",id:"returns-8",level:4},{value:"Defined in",id:"defined-in-14",level:4},{value:"option()",id:"option",level:3},{value:"Type Parameters",id:"type-parameters-2",level:4},{value:"Parameters",id:"parameters-8",level:4},{value:"Returns",id:"returns-9",level:4},{value:"Defined in",id:"defined-in-15",level:4},{value:"parse()",id:"parse",level:3},{value:"Parameters",id:"parameters-9",level:4},{value:"Returns",id:"returns-10",level:4},{value:"Defined in",id:"defined-in-16",level:4},{value:"positional()",id:"positional",level:3},{value:"Type Parameters",id:"type-parameters-3",level:4},{value:"Parameters",id:"parameters-10",level:4},{value:"Returns",id:"returns-11",level:4},{value:"Defined in",id:"defined-in-17",level:4}];function t(e){const r={a:"a",blockquote:"blockquote",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",h4:"h4",h5:"h5",header:"header",hr:"hr",li:"li",p:"p",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(r.header,{children:(0,s.jsx)(r.h1,{id:"class-argvparsertargs",children:"Class: ArgvParser<TArgs>"})}),"\n",(0,s.jsx)(r.p,{children:"The main parser class. This class is used to configure and parse arguments."}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/functions/parser",children:"parser"})," is a small helper function to create a new parser instance."]}),"\n",(0,s.jsx)(r.h2,{id:"type-parameters",children:"Type Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"TArgs"})," ",(0,s.jsx)(r.em,{children:"extends"})," ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/ParsedArgs",children:(0,s.jsx)(r.code,{children:"ParsedArgs"})})," = ",(0,s.jsx)(r.code,{children:"object"})]}),"\n",(0,s.jsx)(r.h2,{id:"implements",children:"Implements"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser",children:(0,s.jsx)(r.code,{children:"ReadonlyArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.h2,{id:"constructors",children:"Constructors"}),"\n",(0,s.jsx)(r.h3,{id:"new-argvparser",children:"new ArgvParser()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"new ArgvParser"}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">(",(0,s.jsx)(r.code,{children:"options"}),"?): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsxs)(r.p,{children:["Creates a new parser. Normally using ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/functions/parser",children:"parser"})," is preferred."]}),"\n",(0,s.jsx)(r.h4,{id:"parameters",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"options?"}),": ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/ParserOptions",children:(0,s.jsx)(r.code,{children:"ParserOptions"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"returns",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L134",children:"packages/parser/src/lib/parser.ts:134"})}),"\n",(0,s.jsx)(r.h2,{id:"properties",children:"Properties"}),"\n",(0,s.jsx)(r.h3,{id:"configuredconflicts",children:"configuredConflicts"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"configuredConflicts"}),": ",(0,s.jsx)(r.code,{children:"Record"}),"<",(0,s.jsx)(r.code,{children:"string"}),", ",(0,s.jsx)(r.code,{children:"Set"}),"<",(0,s.jsx)(r.code,{children:"string"}),">> = ",(0,s.jsx)(r.code,{children:"{}"})]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"The configured conflicts for the parser. If an option is set, and a conflicting option is also set, an error will be thrown."}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-1",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L102",children:"packages/parser/src/lib/parser.ts:102"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"configuredimplies",children:"configuredImplies"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"configuredImplies"}),": ",(0,s.jsx)(r.code,{children:"Record"}),"<",(0,s.jsx)(r.code,{children:"string"}),", ",(0,s.jsx)(r.code,{children:"Set"}),"<",(0,s.jsx)(r.code,{children:"string"}),">> = ",(0,s.jsx)(r.code,{children:"{}"})]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"The configured implies for the parser. If an option is set, the implied option must also be set."}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-2",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L107",children:"packages/parser/src/lib/parser.ts:107"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"configuredoptions",children:"configuredOptions"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"configuredOptions"}),": { [key in string | number | symbol]: InternalOptionConfig }"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"The configured options for the parser."}),"\n",(0,s.jsx)(r.h4,{id:"implementation-of",children:"Implementation of"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser",children:(0,s.jsx)(r.code,{children:"ReadonlyArgvParser"})}),".",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser#configuredoptions",children:(0,s.jsx)(r.code,{children:"configuredOptions"})})]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-3",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L92",children:"packages/parser/src/lib/parser.ts:92"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"configuredpositionals",children:"configuredPositionals"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"configuredPositionals"}),": ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/InternalOptionConfig",children:(0,s.jsx)(r.code,{children:"InternalOptionConfig"})}),"[]"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"The configured positional arguments for the parser"}),"\n",(0,s.jsx)(r.h4,{id:"implementation-of-1",children:"Implementation of"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser",children:(0,s.jsx)(r.code,{children:"ReadonlyArgvParser"})}),".",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser#configuredpositionals",children:(0,s.jsx)(r.code,{children:"configuredPositionals"})})]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-4",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L97",children:"packages/parser/src/lib/parser.ts:97"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"options",children:"options"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"options"}),": ",(0,s.jsx)(r.code,{children:"Required"}),"<",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/ParserOptions",children:(0,s.jsx)(r.code,{children:"ParserOptions"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">>"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"The configuration for the parser itself"}),"\n",(0,s.jsx)(r.h4,{id:"implementation-of-2",children:"Implementation of"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser",children:(0,s.jsx)(r.code,{children:"ReadonlyArgvParser"})}),".",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser#options",children:(0,s.jsx)(r.code,{children:"options"})})]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-5",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L112",children:"packages/parser/src/lib/parser.ts:112"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"parsermap",children:"parserMap"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"parserMap"}),": ",(0,s.jsx)(r.code,{children:"Record"}),"<",(0,s.jsx)(r.code,{children:"string"}),", ",(0,s.jsx)(r.code,{children:"Parser"}),"<",(0,s.jsx)(r.code,{children:"any"}),">>"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"The parsers used to parse individual option types."}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-6",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L117",children:"packages/parser/src/lib/parser.ts:117"})}),"\n",(0,s.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,s.jsx)(r.h3,{id:"asreadonly",children:"asReadonly()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"asReadonly"}),"(): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser",children:(0,s.jsx)(r.code,{children:"ReadonlyArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"returns-1",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/interfaces/ReadonlyArgvParser",children:(0,s.jsx)(r.code,{children:"ReadonlyArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-7",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L552",children:"packages/parser/src/lib/parser.ts:552"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"augment",children:"augment()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"augment"}),"<",(0,s.jsx)(r.code,{children:"TAugment"}),">(",(0,s.jsx)(r.code,{children:"parser"}),"): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"})," & ",(0,s.jsx)(r.code,{children:"TAugment"}),">"]}),"\n"]}),"\n",(0,s.jsxs)(r.p,{children:["Used to combine two parsers into a single parser. Mutates ",(0,s.jsx)(r.code,{children:"this"}),", but returns with updated typings"]}),"\n",(0,s.jsx)(r.h4,{id:"type-parameters-1",children:"Type Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"TAugment"})," ",(0,s.jsx)(r.em,{children:"extends"})," ",(0,s.jsx)(r.code,{children:"object"})]}),"\n",(0,s.jsx)(r.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"parser"}),": ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TAugment"}),">"]}),"\n",(0,s.jsx)(r.p,{children:"The parser to augment the current parser with."}),"\n",(0,s.jsx)(r.h4,{id:"returns-2",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"})," & ",(0,s.jsx)(r.code,{children:"TAugment"}),">"]}),"\n",(0,s.jsx)(r.p,{children:"The updated parser instance."}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-8",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L526",children:"packages/parser/src/lib/parser.ts:526"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"clone",children:"clone()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"clone"}),"(",(0,s.jsx)(r.code,{children:"parserOptions"}),"): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"parameters-2",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"parserOptions"}),": ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/ParserOptions",children:(0,s.jsx)(r.code,{children:"ParserOptions"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),"> = ",(0,s.jsx)(r.code,{children:"..."})]}),"\n",(0,s.jsx)(r.h4,{id:"returns-3",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-9",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L541",children:"packages/parser/src/lib/parser.ts:541"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"config",children:"config()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"config"}),"(",(0,s.jsx)(r.code,{children:"provider"}),"): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"Registers a configuration provider to read configuration from."}),"\n",(0,s.jsx)(r.h4,{id:"parameters-3",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"provider"}),": ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/namespaces/ConfigurationFiles/type-aliases/ConfigurationProvider",children:(0,s.jsx)(r.code,{children:"ConfigurationProvider"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.p,{children:"The configuration provider to register."}),"\n",(0,s.jsx)(r.h4,{id:"returns-4",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-10",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L225",children:"packages/parser/src/lib/parser.ts:225"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"conflicts",children:"conflicts()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"conflicts"}),"(...",(0,s.jsx)(r.code,{children:"options"}),"): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"Registers that a set of options cannot be provided at the same time."}),"\n",(0,s.jsx)(r.h4,{id:"parameters-4",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ...",(0,s.jsx)(r.strong,{children:"options"}),": [",(0,s.jsx)(r.code,{children:"string"}),", ",(0,s.jsx)(r.code,{children:"string"}),", ",(0,s.jsx)(r.code,{children:"...string[]"}),"]"]}),"\n",(0,s.jsx)(r.p,{children:"The options that cannot be provided together."}),"\n",(0,s.jsx)(r.h4,{id:"returns-5",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-11",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L496",children:"packages/parser/src/lib/parser.ts:496"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"env",children:"env()"}),"\n",(0,s.jsx)(r.h4,{id:"envenvprefix",children:"env(envPrefix)"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"env"}),"(",(0,s.jsx)(r.code,{children:"envPrefix"}),"?): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"Enables environment variable population for options."}),"\n",(0,s.jsx)(r.h5,{id:"parameters-5",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"envPrefix?"}),": ",(0,s.jsx)(r.code,{children:"string"})]}),"\n",(0,s.jsxs)(r.p,{children:["Prefix for environment variables. The full environment variable name will be ",(0,s.jsx)(r.code,{children:"${envPrefix}_${optionName}"}),"."]}),"\n",(0,s.jsx)(r.h5,{id:"returns-6",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h5,{id:"defined-in-12",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L204",children:"packages/parser/src/lib/parser.ts:204"})}),"\n",(0,s.jsx)(r.h4,{id:"envoptions",children:"env(options)"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"env"}),"(",(0,s.jsx)(r.code,{children:"options"}),"): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.h5,{id:"parameters-6",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"options"}),": ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/EnvOptionConfig",children:(0,s.jsx)(r.code,{children:"EnvOptionConfig"})})]}),"\n",(0,s.jsx)(r.h5,{id:"returns-7",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h5,{id:"defined-in-13",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L206",children:"packages/parser/src/lib/parser.ts:206"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"implies",children:"implies()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"implies"}),"(",(0,s.jsx)(r.code,{children:"option"}),", ...",(0,s.jsx)(r.code,{children:"options"}),"): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"Registers that the presence of one option implies the presence of one or more other options."}),"\n",(0,s.jsx)(r.h4,{id:"parameters-7",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"option"}),": ",(0,s.jsx)(r.code,{children:"string"})]}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ...",(0,s.jsx)(r.strong,{children:"options"}),": ",(0,s.jsx)(r.code,{children:"string"}),"[]"]}),"\n",(0,s.jsx)(r.p,{children:"The options that imply the other option."}),"\n",(0,s.jsx)(r.h4,{id:"returns-8",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-14",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L513",children:"packages/parser/src/lib/parser.ts:513"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"option",children:"option()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"option"}),"<",(0,s.jsx)(r.code,{children:"TOption"}),", ",(0,s.jsx)(r.code,{children:"TOptionConfig"}),">(",(0,s.jsx)(r.code,{children:"name"}),", ",(0,s.jsx)(r.code,{children:"config"}),"): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"})," & ",(0,s.jsx)(r.code,{children:'{ [key in string]: UndefinedIfRequiredAndNoDefault<TOptionConfig, InferTChoice<TOptionConfig> extends [never] ? TOptionConfig["coerce"] extends Function ? ReturnType<any[any]> : Object[TOptionConfig["type"]] : InferTChoice<TOptionConfig>> }'}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"Registers a new option with the parser."}),"\n",(0,s.jsx)(r.h4,{id:"type-parameters-2",children:"Type Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"TOption"})," ",(0,s.jsx)(r.em,{children:"extends"})," ",(0,s.jsx)(r.code,{children:"string"})]}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"TOptionConfig"})," ",(0,s.jsx)(r.em,{children:"extends"})," ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/OptionConfig",children:(0,s.jsx)(r.code,{children:"OptionConfig"})}),"<",(0,s.jsx)(r.code,{children:"any"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"parameters-8",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"name"}),": ",(0,s.jsx)(r.code,{children:"TOption"})]}),"\n",(0,s.jsx)(r.p,{children:"The name of the option"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"config"}),": ",(0,s.jsx)(r.code,{children:"TOptionConfig"})]}),"\n",(0,s.jsxs)(r.p,{children:["The configuration for the option. See ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/OptionConfig",children:"OptionConfig"})]}),"\n",(0,s.jsx)(r.h4,{id:"returns-9",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"})," & ",(0,s.jsx)(r.code,{children:'{ [key in string]: UndefinedIfRequiredAndNoDefault<TOptionConfig, InferTChoice<TOptionConfig> extends [never] ? TOptionConfig["coerce"] extends Function ? ReturnType<any[any]> : Object[TOptionConfig["type"]] : InferTChoice<TOptionConfig>> }'}),">"]}),"\n",(0,s.jsx)(r.p,{children:"Updated parser instance with the new option registered."}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-15",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L154",children:"packages/parser/src/lib/parser.ts:154"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"parse",children:"parse()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"parse"}),"(",(0,s.jsx)(r.code,{children:"argv"}),"): ",(0,s.jsx)(r.code,{children:"TArgs"})]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"Parses an array of arguments into a structured object."}),"\n",(0,s.jsx)(r.h4,{id:"parameters-9",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"argv"}),": ",(0,s.jsx)(r.code,{children:"string"}),"[] = ",(0,s.jsx)(r.code,{children:"..."})]}),"\n",(0,s.jsx)(r.p,{children:"The array of arguments to parse"}),"\n",(0,s.jsx)(r.h4,{id:"returns-10",children:"Returns"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.code,{children:"TArgs"})}),"\n",(0,s.jsx)(r.p,{children:"The parsed arguments"}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-16",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L235",children:"packages/parser/src/lib/parser.ts:235"})}),"\n",(0,s.jsx)(r.hr,{}),"\n",(0,s.jsx)(r.h3,{id:"positional",children:"positional()"}),"\n",(0,s.jsxs)(r.blockquote,{children:["\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.strong,{children:"positional"}),"<",(0,s.jsx)(r.code,{children:"TOption"}),", ",(0,s.jsx)(r.code,{children:"TOptionConfig"}),">(",(0,s.jsx)(r.code,{children:"name"}),", ",(0,s.jsx)(r.code,{children:"config"}),"): ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"})," & ",(0,s.jsx)(r.code,{children:'{ [key in string]: UndefinedIfRequiredAndNoDefault<TOptionConfig & Object, InferTChoice<TOptionConfig & Object> extends [never] ? (TOptionConfig & Object)["coerce"] extends Function ? ReturnType<any[any]> : Object[(TOptionConfig & Object)["type"]] : InferTChoice<TOptionConfig & Object>> }'}),">"]}),"\n"]}),"\n",(0,s.jsx)(r.p,{children:"Registers a new positional argument with the parser."}),"\n",(0,s.jsx)(r.h4,{id:"type-parameters-3",children:"Type Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"TOption"})," ",(0,s.jsx)(r.em,{children:"extends"})," ",(0,s.jsx)(r.code,{children:"string"})]}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"TOptionConfig"})," ",(0,s.jsx)(r.em,{children:"extends"})," ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/OptionConfig",children:(0,s.jsx)(r.code,{children:"OptionConfig"})}),"<",(0,s.jsx)(r.code,{children:"any"}),">"]}),"\n",(0,s.jsx)(r.h4,{id:"parameters-10",children:"Parameters"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"name"}),": ",(0,s.jsx)(r.code,{children:"TOption"})]}),"\n",(0,s.jsx)(r.p,{children:"The name of the positional argument"}),"\n",(0,s.jsxs)(r.p,{children:["\u2022 ",(0,s.jsx)(r.strong,{children:"config"}),": ",(0,s.jsx)(r.code,{children:"TOptionConfig"})]}),"\n",(0,s.jsxs)(r.p,{children:["The configuration for the positional argument. See ",(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/type-aliases/OptionConfig",children:"OptionConfig"})]}),"\n",(0,s.jsx)(r.h4,{id:"returns-11",children:"Returns"}),"\n",(0,s.jsxs)(r.p,{children:[(0,s.jsx)(r.a,{href:"/cli-forge/api/parser/classes/ArgvParser",children:(0,s.jsx)(r.code,{children:"ArgvParser"})}),"<",(0,s.jsx)(r.code,{children:"TArgs"})," & ",(0,s.jsx)(r.code,{children:'{ [key in string]: UndefinedIfRequiredAndNoDefault<TOptionConfig & Object, InferTChoice<TOptionConfig & Object> extends [never] ? (TOptionConfig & Object)["coerce"] extends Function ? ReturnType<any[any]> : Object[(TOptionConfig & Object)["type"]] : InferTChoice<TOptionConfig & Object>> }'}),">"]}),"\n",(0,s.jsx)(r.p,{children:"Updated parser instance with the new positional argument registered."}),"\n",(0,s.jsx)(r.h4,{id:"defined-in-17",children:"Defined in"}),"\n",(0,s.jsx)(r.p,{children:(0,s.jsx)(r.a,{href:"https://github.com/agentender/cli-forge/blob/e5e7380e743a6609827080c07da24408209a77de/packages/parser/src/lib/parser.ts#L190",children:"packages/parser/src/lib/parser.ts:190"})})]})}function h(e={}){const{wrapper:r}={...(0,i.R)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(t,{...e})}):t(e)}},43023:(e,r,n)=>{n.d(r,{R:()=>l,x:()=>a});var s=n(63696);const i={},d=s.createContext(i);function l(e){const r=s.useContext(d);return s.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function a(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:l(e.components),s.createElement(d.Provider,{value:r},e.children)}}}]);