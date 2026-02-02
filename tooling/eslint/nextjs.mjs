import nextConfig from "eslint-config-next";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

/**
 * ESLint flat config for Next.js applications
 * eslint-config-next 16.x exports native flat config
 */
export const nextjsConfig = [
  ...nextConfig,
  eslintConfigPrettier,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  {
    // TypeScript-specific rules
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", ".next/**", ".turbo/**"],
  },
];

export default nextjsConfig;
