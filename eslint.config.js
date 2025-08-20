const js = require("@eslint/js");
const prettier = require("eslint-config-prettier");
const jestPlugin = require("eslint-plugin-jest");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        __dirname: "readonly",
        process: "readonly",
        setImmediate: "readonly",
        setTimeout: "readonly",
      },
    },
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "warn",
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
    },
  },
  prettier,
];
