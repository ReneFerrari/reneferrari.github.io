import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://reneferrari.github.io',
  integrations: [tailwind()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      langs: ['kotlin', 'typescript', 'javascript', 'bash', 'json', 'yaml', 'swift'],
      wrap: false,
    },
  },
});
