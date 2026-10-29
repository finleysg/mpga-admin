import nextjsConfig from "@mpga/eslint-config/nextjs"

const config = [
	...nextjsConfig,
	{
		// Existing data-loading effects predate the new React compiler lint rule.
		// Keep it visible while migrating them separately from security patches.
		rules: { "react-hooks/set-state-in-effect": "warn" },
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
	},
]

export default config
