---
name: TypeScript checking quirks in this workspace
description: How to reliably run tsc and recover from corrupted node_modules in this repl
---

- Run type checks with `./node_modules/.bin/tsc --noEmit` (npx is broken here); `npm install` via bash is blocked — use the package-management tools instead.
- **Why:** node_modules occasionally shows packages as installed while files are missing on disk; the reliable recovery is uninstall-then-reinstall through the package tools.
- After any tsconfig change, delete `node_modules/typescript/tsbuildinfo` or the incremental cache serves stale results.
- **How to apply:** whenever tsc reports thousands of errors from library .d.ts files or errors persist after a config fix, suspect corrupted packages / stale tsbuildinfo before touching app code.
- translations.ts is huge with 10 language objects; regex/line-based edits break on braces inside strings — always use a TS-AST codemod (see scripts/fix-translations-codemod.ts pattern) and run it from the workspace root so tsx can resolve modules.
