import { createRequire } from 'node:module';
import { defineConfig } from 'vitepress';

const require = createRequire(import.meta.url);
const typedocSidebarLowLevel = require('../lowlevel/typedoc-sidebar.json');
const typedocSidebarHighLevel = require('../highlevel/typedoc-sidebar.json');
const typedocSidebarConstants = require('../constants/typedoc-sidebar.json');

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: '.',
  base: '/av/',
  title: 'NodeAV',
  description: 'FFmpeg bindings for Node.js',
  themeConfig: {
    logo: '/logo.png',

    sidebar: [
      {
        text: 'Low Level API',
        items: typedocSidebarLowLevel,
      },
      {
        text: 'High Level API',
        items: typedocSidebarHighLevel,
      },
      {
        text: 'Constants',
        items: typedocSidebarConstants,
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/seydx/av' }],
  },
});
