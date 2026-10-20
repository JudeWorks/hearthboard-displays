import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://hearthboard-displays.pages.dev',
  trailingSlash: 'always',
  output: 'static',
  vite: { build: { chunkSizeWarningLimit: 1000 } },
});
