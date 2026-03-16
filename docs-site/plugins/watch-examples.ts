import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

export function watchExamples(): Plugin {
  const examplesDir = path.resolve(process.cwd(), '../examples');

  return {
    name: 'watch-examples',
    configureServer(server: ViteDevServer) {
      server.watcher.add(examplesDir);

      function onChange(filePath: string) {
        if (!filePath.includes(`${examplesDir}/`)) return;
        console.log(`[watch-examples] Change detected: ${filePath}`);
        const triggerFile = path.join(
          process.cwd(),
          'pages/+onCreateGlobalContext.server.ts'
        );
        server.watcher.emit('change', triggerFile);
      }

      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
      server.watcher.on('change', onChange);
    },
  };
}
