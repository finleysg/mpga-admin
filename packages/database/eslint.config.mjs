import libraryConfig from "@mpga/eslint-config/library";

export default [
  ...libraryConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
];
