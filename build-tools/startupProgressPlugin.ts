import type { Plugin } from 'vite';

/** Keep the loader independent of the module graph it is downloading. */
export function startupProgressPlugin(): Plugin {
  let worker = true;
  return {
    name: 'startup-progress',
    enforce: 'post',
    apply: 'build',
    configResolved(config) {
      worker = !['android', 'ios', 'steam'].includes(config.env.VITE_APP_PLATFORM || '') && config.env.VITE_OFFLINE_DISTRIBUTABLE !== 'true';
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const html = bundle['index.html'];
        if (!html || html.type !== 'asset') throw new Error('Startup HTML is missing');
        const chunks = Object.values(bundle).filter(item => item.type === 'chunk');
        const entry = chunks.find(item => item.isEntry && item.name === 'index');
        const app = chunks.find(item => item.moduleIds.some(id => id.replaceAll('\\', '/').endsWith('/src/App.tsx')));
        if (!entry || !app) throw new Error('Startup entry or App chunk is missing');
        const resources = new Map<string, { url: string; bytes: number; style: boolean }>();
        const visit = (file: string) => {
          if (resources.has(file)) return;
          const item = bundle[file];
          if (!item || item.type !== 'chunk') return;
          resources.set(file, { url: `./${file}`, bytes: Buffer.byteLength(item.code), style: false });
          for (const dependency of item.imports) visit(dependency);
          const css = (item as typeof item & { viteMetadata?: { importedCss: Set<string> } }).viteMetadata?.importedCss;
          for (const file of css || []) {
            const asset = bundle[file];
            if (asset?.type === 'asset') resources.set(file, {
              url: `./${file}`, bytes: typeof asset.source === 'string' ? Buffer.byteLength(asset.source) : asset.source.byteLength, style: true,
            });
          }
        };
        visit(entry.fileName); visit(app.fileName);
        const config = JSON.stringify({ worker, entry: `./${entry.fileName}`, resources: [...resources.values()] }).replaceAll('<', '\\u003c');
        let source = String(html.source);
        source = source.replace(/<script\b[^>]*\btype="module"[^>]*\bsrc="[^"]+"[^>]*><\/script>/g, '');
        source = source.replace(/<link\b[^>]*\brel="(?:modulepreload|stylesheet)"[^>]*>/g, '');
        html.source = source.replace('</head>', `<script type="application/json" id="startup-config">${config}</script>\n</head>`);
      },
    },
  };
}
