import { defineConfig } from 'vite';

// `base: './'` makes the production build host-agnostic: all asset URLs are
// relative, so the same dist/ works at a domain root or under a sub-path
// (GitHub Pages project sites, etc.). Revisit in Phase 8 if a host needs more.
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    // Phaser alone is ~1.2 MB minified; it is split into its own long-cacheable
    // chunk, so the default 500 kB warning is not meaningful for this project.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
