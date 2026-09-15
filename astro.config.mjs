// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'http://120.24.93.79:23332',
  integrations: [mdx(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
  redirects: {
    '/about/': '/intro/',
  },
});
