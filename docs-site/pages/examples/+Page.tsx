import { useData } from 'vike-react/useData';
import { ExampleCard } from '../../components/ExampleCard';
import type { ExamplesData } from './+data';

export default function ExamplesPage() {
  const { examples } = useData<ExamplesData>();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-100 mb-3">Examples</h1>
      <p className="text-gray-400 mb-8 max-w-2xl">
        Explore working examples demonstrating CLI Forge features.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {examples.map((example) => (
          <ExampleCard key={example.id} example={example} />
        ))}
      </div>

      {examples.length === 0 && (
        <p className="text-gray-500 text-center py-12">
          No examples found. Run the build to generate examples.
        </p>
      )}
    </div>
  );
}
