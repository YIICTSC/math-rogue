import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { startupProgressPlugin } from './build-tools/startupProgressPlugin'

const assetVersion = process.env.VITE_ASSET_VERSION || new Date().toISOString().replace(/\D/g, '').slice(0, 14)

// A shared icon or audio helper must not pull the entire main game into a name-only invite.
function quizChunks() {
  let quiz: Set<string> | null = null, audio: Set<string> | null = null, bootstrap: Set<string> | null = null;
  return (id: string, graph: {getModuleIds: () => IterableIterator<string>; getModuleInfo: (id: string) => {importedIds: readonly string[]; isExternal: boolean} | null}) => {
    const closure = (root: string | undefined) => {
      const found = new Set<string>();
      const visit = (next: string) => { if (found.has(next)) return; const info = graph.getModuleInfo(next); if (!info || info.isExternal) return; found.add(next); info.importedIds.forEach(visit); };
      if (root) visit(root); return found;
    };
    if (!quiz || !audio || !bootstrap) {
      const ids = [...graph.getModuleIds()];
      quiz = closure(ids.find(p => p.replaceAll('\\', '/').endsWith('/src/quiz-show/QuizShow.tsx')));
      // Keep code shared with the tiny invite/startup loader out of the large
      // quiz chunk. Putting the whole bootstrap closure in this manual chunk
      // made the HTML entry download all quiz logic before the app could start.
      const bootstrapEntry = ids.find(p => p.replaceAll('\\', '/').endsWith('/index.tsx') && !p.replaceAll('\\', '/').includes('/src/') && !p.includes('/node_modules/'));
      bootstrap = closure(bootstrapEntry);
      audio = closure(ids.find(p => p.replaceAll('\\', '/').endsWith('/src/services/audioService.ts')));
    }
    if (quiz.has(id) && !bootstrap.has(id)) return 'quiz-show-core';
    if (audio.has(id) && !bootstrap.has(id)) return 'game-audio';
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), startupProgressPlugin()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  define: {
    __APP_ASSET_VERSION__: JSON.stringify(assetVersion),
  },
  build: {
    outDir: 'dist',
    manifest: true,
    rollupOptions: {output: {manualChunks: quizChunks(), onlyExplicitManualChunks: true}},
  },
  base: './', // Ensure relative paths for assets to work on GitHub Pages / Vercel
})
