import Layout from '@theme/Layout';
import React, { useEffect, useState } from 'react';

import type { Example } from '../../tools/scripts/collect-examples';
import { strict } from 'assert';

const Playground: React.FC = ({ examples }: { examples: Example[] }) => {
  const [sandbox, setSandbox] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const getLoaderScript = document.createElement('script');
      getLoaderScript.src = 'https://www.typescriptlang.org/js/vs.loader.js';
      getLoaderScript.async = true;
      getLoaderScript.onload = () => {
        (window.require as any).config({
          paths: {
            vs: 'https://playgroundcdn.typescriptlang.org/cdn/4.0.5/monaco/min/vs',
            sandbox: 'https://www.typescriptlang.org/js/sandbox',
          },
          ignoreDuplicateModules: ['vs/editor/editor.main'],
        });

        (window.require as any)(
          [
            'vs/editor/editor.main',
            'vs/language/typescript/tsWorker',
            'sandbox/index',
          ],
          (main, _tsWorker, sandboxFactory) => {
            const initialCode = `import {markdown, danger} from "cli-forge"

export default async function () {
        // Check for new @types in devDependencies
        const packageJSONDiff = await danger.git.JSONDiffForFile("package.json")
        const newDeps = packageJSONDiff.devDependencies.added
        const newTypesDeps = newDeps?.filter(d => d.includes("@types")) ?? []
        if (newTypesDeps.length){
                markdown("Added new types packages " + newTypesDeps.join(", "))
        }
}
`;

            const isOK = main && (window as any).ts && sandboxFactory;
            if (isOK) {
              document
                .getElementById('loader')
                ?.parentNode?.removeChild(document.getElementById('loader'));
            } else {
              console.error(
                'Could not get all the dependencies of sandbox set up!'
              );
              return;
            }

            const sandboxConfig = {
              text: initialCode,
              compilerOptions: {
                target: 'ES2022',
                lib: ['ES2022', 'es2020', 'dom'],
                // types: ['node'],
              },
              domID: 'monaco-editor-embed',
            };

            const sandbox = sandboxFactory.createTypeScriptSandbox(
              sandboxConfig,
              main,
              (window as any).ts
            );
            setSandbox(sandbox);
            sandbox.editor.focus();
          }
        );
      };

      document.body.appendChild(getLoaderScript);

      return () => {
        document.body.removeChild(getLoaderScript);
      };
    })();
  }, []);

  return (
    <Layout title="TS Playground">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'min-content auto',
        }}
      >
        <nav id="">
          <ul>
            {examples.map((example) => (
              <li key={example.data.id}>
                <button
                  onClick={() => {
                    // @ts-ignore
                    sandbox.editor.setValue(example.files[0].contents);
                  }}
                >
                  {example.data.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <div id="loader">Loading...</div>
          <div id="monaco-editor-embed" style={{ height: '800px' }} />
        </div>
      </div>
    </Layout>
  );
};

export default Playground;
