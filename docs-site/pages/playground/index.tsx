import Layout from '@theme/Layout';
import React, { useRef } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

import type { Example } from '../../../tools/scripts/collect-examples';
import type { EditorRef } from './editor';

import { Toaster } from 'react-hot-toast';

const Playground: React.FC = ({
  examples,
  dts,
}: {
  examples: Example[];
  dts: Record<string, string>;
}) => {
  const editor = useRef<EditorRef>(null);

  return (
    <Layout title="TS Playground">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
        }}
      >
        <nav className="sidebar">
          <h2>Load Example</h2>
          <ul>
            {examples.map((example) => (
              <li key={example.data.id}>
                <button
                  onClick={() => {
                    if (!editor.current) {
                      return;
                    }
                    editor.current.setText(getEntryPointContents(example));
                  }}
                >
                  {example.data.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <BrowserOnly fallback={<div>Loading editor...</div>}>
          {() => {
            // Dynamically import the Editor component only in browser
            const { Editor } = require('./editor');
            return (
              <Editor
                ref={editor}
                initialText={getEntryPointContents(examples[0])}
                dts={dts}
              />
            );
          }}
        </BrowserOnly>
      </div>
      <Toaster />
    </Layout>
  );
};

function getEntryPointContents(example: Example) {
  return example.files.find((file) => file.path === example.data.entryPoint)
    ?.contents;
}

export default Playground;
