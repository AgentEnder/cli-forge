import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

import { ExamplesDocsPlugin } from './src/plugins/examples-plugin';
import { CopyReadmeAndChangelogPlugin } from './src/plugins/copy-readme-changelog';

import RemarkGithubPlugin from 'remark-github';

const config: Config = {
  title: 'FlexiBench',
  tagline: 'Powerful, flexible benchmarking for JavaScript and beyond',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://craigory.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: 'cli-forge',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'agentender', // Usually your GitHub org/user name.
  projectName: 'cli-forge', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../packages/cli-forge/src/index.ts'],
        tsconfig: '../packages/cli-forge/tsconfig.lib.json',
        out: './docs/api/cli-forge',
        readme: 'none',
        name: 'cli-forge',
        id: 'typedoc-cli-forge',
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../packages/parser/src/index.ts'],
        tsconfig: '../packages/parser/tsconfig.lib.json',
        out: './docs/api/parser',
        readme: 'none',
        name: '@cli-forge/parser',
        id: 'typedoc-parser',
      },
    ],
    CopyReadmeAndChangelogPlugin,
    ExamplesDocsPlugin,
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          remarkPlugins: [
            [RemarkGithubPlugin, { repository: 'agentender/cli-forge' }],
          ],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'FlexiBench',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tutorial',
        },
        {
          href: 'https://github.com/agentender/cli-forge',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/cli-forge',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/agentender/cli-forge',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
