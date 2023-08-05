module.exports = {
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  extends: ["eslint:recommended", "plugin:mocha/recommended", "prettier"],
  rules: {
    "mocha/no-mocha-arrows": "off",
  },
  plugins: ["mocha"],
};
