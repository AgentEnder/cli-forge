import rehypeShiki from '@shikijs/rehype';
import { join } from 'node:path';
import type { Config } from 'vike/types';
import { forgeTheme } from '../server/utils/highlighter';
import { workspaceRoot } from '../server/utils/workspace';

const root = workspaceRoot();

export default {
  typedocDir: join(root, '.typedoc'),
  packagesDir: join(root, 'packages'),
  rehypePlugins: [[rehypeShiki, { theme: forgeTheme }]],
} satisfies Config['typedoc'];
