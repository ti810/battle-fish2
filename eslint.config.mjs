import { defineConfig } from "eslint/config";
import tseslint from "@electron-toolkit/eslint-config-ts";
import eslintConfigPrettier from "@electron-toolkit/eslint-config-prettier";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";

export default defineConfig([
  // Ignorar pastas
  { ignores: ["**/node_modules", "**/dist", "**/out"] },

  // Configs recomendadas TypeScript
  tseslint.configs.recommended,

  // React configs
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat["jsx-runtime"],

  // Prettier
  eslintConfigPrettier,

  // Regras específicas para TSX
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": eslintPluginReactHooks,
      "react-refresh": eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
]);