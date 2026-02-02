import globals from "globals";

import { baseConfig } from "./base.mjs";

/**
 * ESLint flat config for library packages
 */
export const libraryConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];

export default libraryConfig;
