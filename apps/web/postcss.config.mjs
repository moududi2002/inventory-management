// apps/web/postcss.config.mjs

// Tailwind v4 uses @tailwindcss/postcss — no autoprefixer needed.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
