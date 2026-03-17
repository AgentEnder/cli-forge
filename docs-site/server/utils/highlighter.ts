import { createHighlighter } from 'shiki';

export const forgeTheme = {
  name: 'forge',
  type: 'dark' as const,
  colors: {
    'editor.background': '#0d0906f2',
    'editor.foreground': '#c4a882',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#6a5040', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#ff8c38' },
    },
    {
      scope: ['string', 'string.quoted'],
      settings: { foreground: '#ffb347' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#e8c090' },
    },
    {
      scope: ['entity.name.type', 'support.type', 'entity.name.class', 'support.class'],
      settings: { foreground: '#ffd5a0' },
    },
    {
      scope: ['constant.numeric', 'constant.language'],
      settings: { foreground: '#ff6a35' },
    },
    {
      scope: ['keyword.operator', 'punctuation', 'meta.brace', 'punctuation.separator'],
      settings: { foreground: '#a08060' },
    },
    {
      scope: ['variable', 'variable.other'],
      settings: { foreground: '#c4a882' },
    },
    {
      scope: ['variable.parameter'],
      settings: { foreground: '#d4b898' },
    },
    {
      scope: ['entity.name.tag'],
      settings: { foreground: '#ff8c38' },
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: { foreground: '#e8c090' },
    },
    {
      scope: ['constant.other', 'variable.other.constant'],
      settings: { foreground: '#ff6a35' },
    },
    {
      scope: ['meta.import', 'keyword.control.import', 'keyword.control.from'],
      settings: { foreground: '#ff8c38' },
    },
    {
      scope: ['string.regexp'],
      settings: { foreground: '#d08060' },
    },
  ],
};

let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;

export async function getHighlighter() {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: [forgeTheme],
      langs: [
        'typescript', 'javascript', 'json', 'yaml', 'toml',
        'markdown', 'css', 'html', 'bash', 'tsx', 'jsx',
      ],
    });
  }
  return highlighterInstance;
}
