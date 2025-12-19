/**
 * Debug what TProps is being inferred as
 */
import { parser, ObjectOptionConfig, ResolveProperties } from '@cli-forge/parser';

// Explicitly capture what TProps is
type CaptureProps<TProps extends Record<string, { type: string }>> = TProps;

function testOption<
  TCoerce,
  const TProps extends Record<string, { type: string }>
>(
  config: ObjectOptionConfig<TCoerce, TProps>
): { props: TProps; resolved: ResolveProperties<TProps> } {
  return {} as any;
}

const result = testOption({
  type: 'object',
  properties: {
    server: {
      type: 'object',
      properties: {
        host: { type: 'string', default: 'localhost' },
        port: { type: 'number', default: 3000 },
      },
    },
    name: { type: 'string' },
  },
  coerce: (val) => {
    // What is val?
    return val;
  },
});

// What is result.props?
type InferredProps = typeof result.props;
//   ^?

// What is result.resolved?
type InferredResolved = typeof result.resolved;
//   ^?
