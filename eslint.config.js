import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const nodeGlobals = {
  process: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  Buffer: "readonly",
  console: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
};

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: nodeGlobals,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      "no-undef": "off",
    },
  },
  {
    files: ["test/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: nodeGlobals,
      parserOptions: {
        project: "./tsconfig.test.json",
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      "no-undef": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "*.config.ts", "*.config.js"],
  },
];
