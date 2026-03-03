import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://csdb.gg',
  integrations: [sitemap({
    filter: (page) =>
      page !== 'https://csdb.gg/search/' &&
      page !== 'https://csdb.gg/economy-guide/',
  })],
  build: { format: 'directory' },
});
