module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:mocha/recommended', 'prettier'],
  rules: {
    'mocha/no-mocha-arrows': 'off',
  },
  plugins: ['mocha'],
};
