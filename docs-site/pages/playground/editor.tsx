import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useColorMode } from '@docusaurus/theme-common';

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import { createTypeScriptSandbox } from '@typescript/sandbox';

import styles from './editor.module.scss';
import toast from 'react-hot-toast';

export interface EditorRef {
  getText: () => string;
  setText: (text: string) => void;
  cleanup: () => void;
}

export interface EditorProps {
  initialText: string;
  dts?: Record<string, string>;
}

export const Editor = forwardRef<EditorRef, EditorProps>(
  ({ initialText, dts }: EditorProps, ref) => {
    dts ??= {};

    const [sandbox, setSandbox] =
      useState<ReturnType<typeof createTypeScriptSandbox>>(null);

    const [ts, setTs] = useState<typeof import('typescript')>(null);
    const [monaco, setMonaco] = useState<typeof import('monaco-editor')>(null);

    const { colorMode } = useColorMode();

    useImperativeHandle(ref, () => ({
      getText: () => sandbox?.getText(),
      setText: (text: string) => {
        sandbox?.setText(text);

        // clear the hash, as its not representative of the current state
        window.history.pushState(null, null, '#');
      },
      cleanup: () => {
        sandbox.getModel().dispose();
        sandbox.editor.dispose;
      },
    }));

    useEffect(() => {
      (async () => {
        const [ts, monaco] = (await Promise.all([
          import('typescript'),
          import('monaco-editor'),
        ])) as [typeof import('typescript'), typeof import('monaco-editor')];

        setTs(ts);
        setMonaco(monaco);
      })();
    }, []);

    useEffect(() => {
      (async () => {
        if (!ts || !monaco) {
          return;
        }

        const contents = window.location.hash
          ? decompressFromEncodedURIComponent(window.location.hash.slice(1))
          : initialText;

        const sandbox = createTypeScriptSandbox(
          {
            domID: 'monaco-editor-embed',
            filetype: 'ts',
            text: contents,
            acquireTypes: false,
            monacoSettings: {
              automaticLayout: true,
            },
          },
          monaco,
          ts
        );

        Object.keys(dts).forEach((path) => {
          // console.log('Adding', path, 'code:', dts[path]);
          sandbox.languageServiceDefaults.addExtraLib(dts[path], path);
        });

        setSandbox(sandbox);

        return () => {
          console.log('Disposing sandbox');
          sandbox.getModel().dispose();
          sandbox.editor.dispose();
        };
      })();
    }, [ts, monaco]);

    useEffect(() => {
      if (colorMode === 'dark') {
        monaco?.editor?.setTheme('vs-dark');
      } else {
        monaco?.editor?.setTheme('vs-light');
      }
    }, [colorMode, monaco]);

    useEffect(() => {
      if (!sandbox) {
        return;
      }

      const listener = (event: React.KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          // Encode's the editor contents and sets it as the hash
          const uriComponent = compressToEncodedURIComponent(sandbox.getText());

          if (!window.history?.pushState) {
            toast.error(
              'Your browser does not support this feature - unable to save.'
            );
          } else {
            window.history.pushState(null, null, `#${uriComponent}`);
          }

          // Copies new URL to clipboard
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Saved and copied to clipboard');
          }

          // Prevent the default save dialog
          event.preventDefault();
        }
      };

      document.addEventListener('keydown', listener as any);

      return () => {
        document.removeEventListener('keydown', listener as any);
      };
    }, [sandbox]);

    return (
      <>
        {!sandbox ? <div id="loader">Loading...</div> : null}
        <div
          id="monaco-editor-embed"
          className={styles.editor}
          style={{ height: '800px' }}
        />
        {/* TODO: Revisit this later. */}
        {/* <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
          <button>View on TS Playground</button>
        </div> */}
      </>
    );
  }
);
