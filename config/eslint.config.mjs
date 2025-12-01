import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.config.js',
      '.prettierrc.js',
      'public/**',
    ],
  },
  js.configs.recommended,
  // Main configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        __DEV__: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
      prettier: prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,
      'no-console': 'warn',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'prettier/prettier': 'error',
    },
  },
  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '__tests__/**/*', '__mocks__/**/*'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        NodeJS: 'readonly',
        fail: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // E2E test files configuration (Detox native)
  {
    files: ['e2e/native/**/*.e2e.ts', 'e2e/native/**/*.e2e.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        device: 'readonly',
        element: 'readonly',
        by: 'readonly',
        waitFor: 'readonly',
        expect: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // E2E test files configuration (Playwright web)
  {
    files: ['e2e/web/**/*.spec.ts', 'e2e/web/**/*.spec.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Jest config files
  {
    files: ['config/jest.setup.js', 'config/jest.env-setup.js', 'config/jest.config.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        module: 'writable',
      },
    },
  },
];
