import js from '@eslint/js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      'coverage/',
      '*.config.js',
      '*.config.ts',
      'tsconfig*.json',
      '*.tsbuildinfo',
      '.opencode/',
      '*.js',
      'scripts.js',
      'scrape-data.js',
      'scrape-opencode-zen.js',
      'test-*.ts',
      '*test*.ts',
      '*.md',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        URLSearchParams: 'readonly',
        import: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off', // Turn off for TypeScript, will be handled by TS
      'no-undef': 'off', // Turn off for TypeScript, will be handled by TS
    },
  },
];
