# Development Notes

@README.md

## Development flow

- Source code is in src/ with tests in test/
- The plugin entrypoint is in src/main.ts
- The plugin is intended to be installed from build/, not the project root.
  - manifest.json and styles.css are in src/ for editing, and copied to build/ during the build step.
- Use `npm run build` to compile source, build tests, and copy all artifacts (e.g. main.js, styles.css) to build/ directory
- Use `npm run fix && npm run lint` to fix some style errors and identify the rest
  - ALWAYS treat warnings and lint messages as errors to be immediately fixed.
  - `npm run fix` is a faster and more reliable way to fix errors (such as missing `\n` at the end of a file) than editing the file yourself
- Run `npm run build && npm run deploy_local` to allow the user to test changes
  - deploy_local copies plugin files from build/ to the user's Obsidian vault
- This project uses very strict lint and compilation flags that your default coding style does not follow.
  - In particular, before writing a new test, you'll want to read an existing test to be able to copy its style.
- ALWAYS give the user a chance to test the plugin in Obsidian. Tests can't cover all Obsidian integration points, so even if the tests pass, you can't know if your code works until the user has tested it too.

## Testing

- Tests are in test/
- Directory structure and filenames should mirror their implementations in src/
- Tests use node's built-in testing library (no jest, etc)
- Run tests with `npm test`

## Plugin scope

This plugin is designed specifically for the user's personal vault and workflow. Generality and configurability are not goals—hardcoded filenames and vault-specific behavior are acceptable.
