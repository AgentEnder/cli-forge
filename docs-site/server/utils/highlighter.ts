import { createHighlighter } from 'shiki';

export const blueprintTheme = {
  name: 'blueprint',
  type: 'dark' as const,
  colors: {
    'editor.background': '#122a48f2',
    'editor.foreground': '#e8edf4',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#6b8aaa', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#8ec8e8' },
    },
    {
      scope: ['string', 'string.quoted'],
      settings: { foreground: '#7cc9a0' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#b8d8f0' },
    },
    {
      scope: ['entity.name.type', 'support.type', 'entity.name.class', 'support.class'],
      settings: { foreground: '#a8d0f0' },
    },
    {
      scope: ['constant.numeric', 'constant.language'],
      settings: { foreground: '#d4a94e' },
    },
    {
      scope: ['keyword.operator', 'punctuation', 'meta.brace', 'punctuation.separator'],
      settings: { foreground: '#8fa4be' },
    },
    {
      scope: ['variable', 'variable.other'],
      settings: { foreground: '#e8edf4' },
    },
    {
      scope: ['variable.parameter'],
      settings: { foreground: '#c8d8e8' },
    },
    {
      scope: ['entity.name.tag'],
      settings: { foreground: '#8ec8e8' },
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: { foreground: '#b8d8f0' },
    },
    {
      scope: ['constant.other', 'variable.other.constant'],
      settings: { foreground: '#d4a94e' },
    },
    {
      scope: ['meta.import', 'keyword.control.import', 'keyword.control.from'],
      settings: { foreground: '#8ec8e8' },
    },
    {
      scope: ['string.regexp'],
      settings: { foreground: '#d0907a' },
    },
  ],
};

let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;

export async function getHighlighter() {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: [blueprintTheme],
      langs: [
        'typescript', 'javascript', 'json', 'yaml', 'toml',
        'markdown', 'css', 'html', 'bash', 'tsx', 'jsx',
      ],
    });
  }
  return highlighterInstance;
}
