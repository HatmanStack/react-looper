/* eslint-env node */
/* eslint-disable no-undef */
module.exports = {
  root: true,
  extends: [
    "expo",
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["prettier"],
  env: {
    node: true,
  },
  rules: {
    "prettier/prettier": "error",
    "no-console": "off",
    "no-undef": "warn",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-require-imports": "off",
    "react-hooks/set-state-in-effect": "off",
  },
  overrides: [
    {
      // Relax rules for test files
      files: ["**/__tests__/**/*", "**/*.test.ts", "**/*.test.tsx", "**/test-utils/**/*"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "off",
      },
    },
    {
      // Relax rules for migration files
      files: ["**/migrations/**/*"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
    {
      // Relax rules for mock files
      files: ["**/mock/**/*"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-require-imports": "off",
      },
    },
    {
      // Allow setState in effects for specific components
      files: ["**/SaveModal.tsx", "**/TrackProgressBar.tsx"],
      rules: {
        "react-hooks/set-state-in-effect": "off",
      },
    },
  ],
};
