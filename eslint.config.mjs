import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Dates are DD-MM-YYYY site-wide. The locale-aware formatters below follow
 * the *visitor's device* locale, which silently renders MM-DD-YYYY on
 * US-configured phones and laptops — the exact bug this bans. Use formatDate
 * / formatMonthYear from lib/utils.ts, which are device-independent.
 */
const NO_LOCALE_DATES = [
  {
    selector: "CallExpression > MemberExpression[property.name='toLocaleDateString']",
    message: "Device-locale dependent. Use formatDate() from @/lib/utils — dates are DD-MM-YYYY site-wide.",
  },
  {
    selector: "CallExpression > MemberExpression[property.name='toLocaleTimeString']",
    message: "Device-locale dependent. Format times explicitly instead of relying on the visitor's locale.",
  },
  {
    selector: "NewExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']",
    message: "Device-locale dependent. Use formatDate() / formatMonthYear() from @/lib/utils.",
  },
  {
    selector: "CallExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']",
    message: "Device-locale dependent. Use formatDate() / formatMonthYear() from @/lib/utils.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": ["error", ...NO_LOCALE_DATES],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
