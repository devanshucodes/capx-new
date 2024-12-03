import {
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
  vitePlugin as remixVitePlugin,
} from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig((config) => {
  return {
    base: '/', // No base path needed for Netlify
    build: {
      outDir: 'dist', // Netlify will use this folder
      target: 'esnext',
      chunkSizeWarningLimit: 100000000, // Increase chunk size warning limit to 1000 KB
      rollupOptions: {
        output: {
          // Split larger dependencies into smaller chunks
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Split large node_modules packages
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react'; // Separate React into its own chunk
              }
              if (id.includes('lodash')) {
                return 'lodash'; // Separate lodash into its own chunk
              }
              if (id.includes('axios')) {
                return 'axios'; // Separate axios into its own chunk
              }
              if (id.includes('chart.js')) {
                return 'chartjs'; // Separate chart.js into its own chunk
              }
              if (id.includes('vue')) {
                return 'vue'; // Separate Vue into its own chunk (if using Vue)
              }
              return 'vendor'; // Other third-party libraries
            }
          },
        },
      },
    },
    plugins: [
      nodePolyfills({
        include: ['path', 'buffer'],
      }),
      config.mode !== 'test' && remixCloudflareDevProxy(),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
        },
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config.mode === 'production' && optimizeCssModules({ apply: 'build' }),
    ],
    envPrefix: [
      'VITE_',
      'OPENAI_LIKE_API_',
      'OLLAMA_API_BASE_URL',
      'LMSTUDIO_API_BASE_URL',
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  };
});

function chrome129IssuePlugin() {
  return {
    name: 'chrome129IssuePlugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers['user-agent']?.match(/Chrom(e|ium)\/([0-9]+)\./);

        if (raw) {
          const version = parseInt(raw[2], 10);

          if (version === 129) {
            res.setHeader('content-type', 'text/html');
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development, see <a href="https://github.com/stackblitz/bolt.new/issues/86#issuecomment-2395519258">for more information.</a></p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>',
            );

            return;
          }
        }

        next();
      });
    },
  };
}





