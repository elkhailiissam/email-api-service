import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {ignores: ["eslint.config.mjs"]},
  {
    languageOptions: { 
      globals: { ...globals.node, ...globals.jest },
      ecmaVersion: 2022,
      sourceType: "commonjs"
    }
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "no-undef": "error"
    }
  }
];
