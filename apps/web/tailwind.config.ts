// apps/web/tailwind.config.ts

// Tailwind v4 — most config is now done in CSS (@theme block).
// This file exists mainly for plugin/tooling compatibility.

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
