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
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1
          className="text-4xl md:text-6xl font-bold tracking-wide text-gray-100 mb-6 opacity-0 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          CLI FORGE
        </h1>

        <p
          className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in"
          style={{ animationDelay: '500ms' }}
        >
          A type-safe CLI builder for Node.js with first-class TypeScript
          support
        </p>

        <div
          className="flex items-center justify-center gap-6 mb-16 opacity-0 animate-fade-in"
          style={{ animationDelay: '700ms' }}
        >
          <Link
            href="/docs"
            className="px-6 py-2.5 border border-blue-500 text-blue-400 font-medium text-sm tracking-wider hover:bg-blue-500/10 hover:text-blue-300 transition-all rounded"
          >
            GET STARTED
          </Link>
          <Link
            href="/examples"
            className="px-6 py-2.5 border border-gray-600 text-gray-400 font-medium text-sm tracking-wider hover:border-gray-400 hover:text-gray-200 transition-all rounded"
          >
            VIEW EXAMPLES
          </Link>
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
          <h2 className="text-2xl font-bold text-gray-100">Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="border border-gray-700 rounded p-5 hover:border-gray-600 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-200 mb-2">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
