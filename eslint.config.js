import js from '@eslint/js';
import tseslint from 'typescript-eslint';
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
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
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
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
    },
  },
];
