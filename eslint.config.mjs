import baseConfig from "@mpga/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      ".turbo/**",
      "apps/**",
      "packages/**",
      "tooling/**",
    ],
  },
];
