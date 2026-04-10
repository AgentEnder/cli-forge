import cliForge from 'cli-forge';

const cli = cliForge('filter-demo')
  .option('filter', {
    type: 'object',
    description: 'Filter criteria for search results',
    properties: {
      prs: {
        type: 'oneOf',
        description:
          'Filter by PR count — a shorthand like ">5" or structured min/max',
        valueTypes: [
          {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
            },
          },
          { type: 'string' },
        ],
      } as any,
      stars: {
        type: 'oneOf',
        description:
          'Filter by star count — a shorthand like ">=100" or structured min/max',
        valueTypes: [
          {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' },
            },
          },
          { type: 'string' },
        ],
      } as any,
    },
  })
  .handler((args) => {
    const parts: string[] = [];
    if (args.filter?.prs !== undefined) {
      parts.push(`prs=${JSON.stringify(args.filter.prs)}`);
    }
    if (args.filter?.stars !== undefined) {
      parts.push(`stars=${JSON.stringify(args.filter.stars)}`);
    }
    if (parts.length === 0) {
      console.log('No filters applied');
    } else {
      console.log(`Filters: ${parts.join(', ')}`);
    }
  });

export default cli;

if (require.main === module) {
  (async () => {
    await cli.forge();
  })();
}
