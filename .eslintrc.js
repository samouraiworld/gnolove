module.exports = {
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended', 'next'],

  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],

  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always'],
    'no-console': ['error', { allow: ['error', 'time', 'timeEnd', 'timeLog'] }],
    // 'no-restricted-imports': ['error', { patterns: [{ group: '.*', name: 'No relative imports' }] }],

    'linebreak-style': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
};
