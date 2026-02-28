import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: typescriptParser,
      globals: {
        ...globals.node,
        ...globals.browser,
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier: prettier,
    },
    rules: {
      "prettier/prettier": ["error", { singleQuote: false }],
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "ios/", "android/", ".expo/"],
  },
];
