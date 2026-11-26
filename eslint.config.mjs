import globals from 'globals';

export default [
  { ignores: ['node_modules/**', '.pnpm-store/**', 'data/**', 'artifacts/**', 'website/dist/**'] },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { ecmaVersion: 'latest', globals: { ...globals.node } },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      'no-constant-condition': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-prototype-builtins': 'error',
      'no-eval': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
    },
  },
  {
    files: ['public/**/*.js', 'website/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['lib/container-helper.cjs', 'test/fixtures/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
];
