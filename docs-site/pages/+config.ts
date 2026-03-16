import vikeReact from 'vike-react/config';
import type { Config } from 'vike/types';

export default {
  title: 'CLI Forge',
  description:
    'A type-safe CLI builder for Node.js with first-class TypeScript support',
  prerender: true,
  passToClient: ['navigation'],
  extends: [vikeReact],
} satisfies Config;
