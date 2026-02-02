import nextjsConfig from "@mpga/eslint-config/nextjs";

const config = [
  ...nextjsConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
];

export default config;
