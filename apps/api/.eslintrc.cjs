// ESLint config specific to NestJS API
// Uses CommonJS because NestJS CLI expects this format
module.exports = {
  root: false,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['../../eslint.config.mjs'],
  ignorePatterns: ['.eslintrc.cjs', 'dist', 'node_modules'],
  rules: {
    // NestJS-specific relaxations
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
