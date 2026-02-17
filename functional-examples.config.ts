import { createJavaScriptPlugin } from '@functional-examples/javascript';
import { createYamlManifestPlugin } from '@functional-examples/yaml-manifest';
import { createTestPlugin } from '@functional-examples/test';
import type { Config } from 'functional-examples';

const config: Config = {
  root: './examples',
  plugins: [
    createJavaScriptPlugin(),
    createYamlManifestPlugin(),
    createTestPlugin(),
  ],
};

export default config;
