# Type-check and lint

Run TypeScript type checking and ESLint in sequence to catch all errors before committing.

```bash
npm run type-check && npm run lint
```

Fix any reported issues before proceeding. Do not suppress errors with `// @ts-ignore` or `eslint-disable` comments.
