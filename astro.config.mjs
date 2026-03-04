import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wiki.csgoluck.com',
  integrations: [sitemap({
    filter: (page) =>
      page !== 'https://wiki.csgoluck.com/search/' &&
      page !== 'https://wiki.csgoluck.com/economy-guide/',
  })],
  build: { format: 'directory' },
  server: { port: 4322 },
});
