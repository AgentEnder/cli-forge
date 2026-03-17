import { Link } from '../../components/Link';

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <FeatureGrid />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 overflow-hidden">
      {/* Radial heat bloom behind the title */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 45%, rgba(255,106,0,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="text-center max-w-4xl mx-auto relative z-10">
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-wider mb-6 opacity-0 animate-fade-in font-[Cinzel]"
          style={{
            animationDelay: '300ms',
            background: 'linear-gradient(180deg, #fff5e0 0%, #ffb347 30%, #ff6a00 60%, #cc3300 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(255,106,0,0.3))',
          }}
        >
          CLI FORGE
        </h1>

        {/* Molten divider under the title */}
        <div
          className="max-w-64 mx-auto mb-8 animate-fade-in"
          style={{
            animationDelay: '450ms',
            opacity: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #cc4400, #ff6a00, #ffb347, #ff6a00, #cc4400, transparent)',
            backgroundSize: '200% 100%',
            animation: 'fade-in 0.6s ease 450ms forwards, molten-flow 4s linear infinite',
            boxShadow: '0 0 20px rgba(255,106,0,0.12)',
          }}
        />

        <p
          className="text-lg md:text-xl text-forge-ash mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in"
          style={{ animationDelay: '550ms' }}
        >
          A type-safe CLI builder for Node.js with first-class TypeScript
          support
        </p>

        <div
          className="flex items-center justify-center gap-6 mb-20 opacity-0 animate-fade-in"
          style={{ animationDelay: '700ms' }}
        >
          <Link
            href="/docs"
            className="px-8 py-3 border border-forge-ember text-forge-ember-bright font-semibold text-sm tracking-wider hover:bg-forge-ember/10 hover:text-forge-flame transition-all rounded"
          >
            GET STARTED
          </Link>
          <Link
            href="/examples"
            className="px-8 py-3 border border-forge-steel text-forge-ash font-semibold text-sm tracking-wider hover:border-forge-ash hover:text-forge-smoke transition-all rounded"
          >
            VIEW EXAMPLES
          </Link>
        </div>

        {/* Code preview */}
        <div
          className="max-w-lg mx-auto text-left opacity-0 animate-fade-in"
          style={{ animationDelay: '850ms' }}
        >
          <div
            className="rounded-lg border border-forge-iron-light overflow-hidden"
            style={{ background: 'rgba(13,9,6,0.9)' }}
          >
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-forge-iron-light" style={{ background: 'rgba(30,20,13,0.8)' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#cc4400', boxShadow: '0 0 4px #cc4400' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff8c38', boxShadow: '0 0 4px #ff8c38' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ffb347', boxShadow: '0 0 4px #ffb347' }} />
              <span className="ml-2 text-[0.65rem] text-forge-ash-dim font-mono">hello-world.ts</span>
            </div>
            <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
              <code>
                <span style={{ color: '#ff8c38' }}>import</span>
                <span style={{ color: '#c4a882' }}>{' { '}</span>
                <span style={{ color: '#e8c090' }}>cli</span>
                <span style={{ color: '#c4a882' }}>{' } '}</span>
                <span style={{ color: '#ff8c38' }}>from</span>
                <span style={{ color: '#ffb347' }}>{` 'cli-forge'`}</span>
                <span style={{ color: '#a08060' }}>;</span>
                {'\n\n'}
                <span style={{ color: '#e8c090' }}>cli</span>
                <span style={{ color: '#a08060' }}>(</span>
                <span style={{ color: '#ffb347' }}>{`'hello'`}</span>
                <span style={{ color: '#a08060' }}>)</span>
                {'\n'}
                <span style={{ color: '#a08060' }}>{'  .'}</span>
                <span style={{ color: '#e8c090' }}>option</span>
                <span style={{ color: '#a08060' }}>(</span>
                <span style={{ color: '#ffb347' }}>{`'name'`}</span>
                <span style={{ color: '#a08060' }}>{`, { `}</span>
                <span style={{ color: '#c4a882' }}>type</span>
                <span style={{ color: '#a08060' }}>{`: `}</span>
                <span style={{ color: '#ffb347' }}>{`'string'`}</span>
                <span style={{ color: '#a08060' }}>{` }`}</span>
                <span style={{ color: '#a08060' }}>)</span>
                {'\n'}
                <span style={{ color: '#a08060' }}>{'  .'}</span>
                <span style={{ color: '#e8c090' }}>command</span>
                <span style={{ color: '#a08060' }}>(</span>
                <span style={{ color: '#ffb347' }}>{`'greet'`}</span>
                <span style={{ color: '#a08060' }}>{`, {`}</span>
                {'\n'}
                <span style={{ color: '#a08060' }}>{'    '}</span>
                <span style={{ color: '#e8c090' }}>handler</span>
                <span style={{ color: '#a08060' }}>{`: (`}</span>
                <span style={{ color: '#c4a882' }}>args</span>
                <span style={{ color: '#a08060' }}>{`) => {`}</span>
                {'\n'}
                <span style={{ color: '#6a5040', fontStyle: 'italic' }}>{'      // args.name is fully typed'}</span>
                {'\n'}
                <span style={{ color: '#a08060' }}>{'      '}</span>
                <span style={{ color: '#c4a882' }}>console</span>
                <span style={{ color: '#a08060' }}>.</span>
                <span style={{ color: '#e8c090' }}>log</span>
                <span style={{ color: '#a08060' }}>(</span>
                <span style={{ color: '#ffb347' }}>{`\`Hello, \${`}</span>
                <span style={{ color: '#c4a882' }}>args</span>
                <span style={{ color: '#a08060' }}>.</span>
                <span style={{ color: '#c4a882' }}>name</span>
                <span style={{ color: '#ffb347' }}>{`}!\``}</span>
                <span style={{ color: '#a08060' }}>)</span>
                {'\n'}
                <span style={{ color: '#a08060' }}>{'    }'}</span>
                {'\n'}
                <span style={{ color: '#a08060' }}>{'  }'}</span>
                <span style={{ color: '#a08060' }}>)</span>
                {'\n'}
                <span style={{ color: '#a08060' }}>{'  .'}</span>
                <span style={{ color: '#e8c090' }}>forge</span>
                <span style={{ color: '#a08060' }}>()</span>
                <span style={{ color: '#a08060' }}>;</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="flex justify-center gap-12 mt-20 mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '1000ms' }}>
          {[
            { value: '6', label: 'Option Types' },
            { value: '∞', label: 'Nesting Depth' },
            { value: '100%', label: 'Type Inference' },
            { value: '0', label: 'Runtime Cost' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-black font-[Cinzel]" style={{ background: 'linear-gradient(180deg, #ffd5a0, #ff6a00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
              <div className="text-[0.65rem] font-semibold tracking-widest uppercase text-forge-ash-dim mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    title: 'Type Safety',
    description:
      'Full type inference for parsed arguments based on your option definitions.',
  },
  {
    title: 'Flexible Options',
    description:
      'Strings, numbers, booleans, arrays, and nested objects with full TypeScript inference.',
  },
  {
    title: 'Command Hierarchy',
    description:
      'Unlimited nesting with inherited options and lazy subcommand building.',
  },
  {
    title: 'Middleware',
    description:
      'Transform arguments between parsing and handler execution.',
  },
  {
    title: 'Auto Documentation',
    description:
      'Generate documentation automatically from your CLI definition.',
  },
  {
    title: 'Test Harness',
    description:
      'Built-in test harness for unit testing your CLI commands.',
  },
];

function FeatureGrid() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="forge-divider max-w-xs mx-auto mb-12" />
          <h2 className="text-2xl font-bold text-forge-flame-bright font-[Cinzel]">Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="border border-forge-iron-light rounded-lg p-5 hover:border-forge-steel transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(145deg, rgba(30,20,13,0.6), rgba(23,15,10,0.8))' }}
            >
              <h3 className="text-forge-flame-bright text-sm font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-forge-ash text-xs leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
