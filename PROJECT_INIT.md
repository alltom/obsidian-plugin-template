# New Obsidian Plugin Project Initialization

This document provides step-by-step instructions for creating a new Obsidian plugin project.

## Prerequisites

Before starting, you'll need to decide on the following information:

1. **Plugin ID** (e.g., `obsidian-foo`) - Used in manifest.json and as the directory name. Must be unique in the Obsidian plugin ecosystem.
2. **Plugin Name** (e.g., `Foo`) - The display name users will see
3. **Plugin Description** - A brief description of what your plugin does
4. **Plugin License** - For package.json (default: MIT)
5. **Author Name** - Your name as it should appear in the plugin
6. **Author URL** (optional) - Your website or profile URL
7. **Author Email** - For the package.json author field
8. **Local Obsidian Vault Path** - The path to your Obsidian vault for testing (e.g., `/Users/yourname/Documents/MyVault`)

## Step-by-Step Setup

### 0. Set up a system to track your progress

There are many steps! Make a checklist for yourself to track your progress. Include every single step and substep in your checklist to ensure you don't miss anything.

### 1. Initialize Project Structure

#### 1.1. Action

```bash
mkdir -p src test scripts build
```

### 2. Create Git Configuration

#### 2.1. Action

Create `.gitignore`:

```
node_modules/
build/
.env
```

#### 2.2. Commit

Now, stage and commit the changes with the message 'create .gitignore'.

### 3. Create `package.json`

#### 3.1. Action

Use `npm init` with flags to pre-fill the `package.json` file. Replace the bracketed placeholders with your actual values.

```bash
npm init -y \
  --init-author-name="[AUTHOR_NAME]" \
  --init-author-email="[AUTHOR_EMAIL]" \
  --init-author-url="[AUTHOR_URL]" \
  --init-license="[LICENSE]"
```

#### 3.2. Commit

Now, stage and commit the changes. The commit message should be the command you ran, including all flags and values.

#### 3.3. Action

Next, edit the generated `package.json` file using the following commands. Be sure to replace the bracketed placeholders with your actual values.

```bash
npm pkg set name="[PLUGIN_ID]"
npm pkg set description="[PLUGIN_DESCRIPTION]"
npm pkg set main="index.js"
npm pkg delete scripts.test
```

#### 3.4. Commit

Now, stage and commit the changes with the message 'customize package.json'.

#### 3.5. Verification

Run the following command to ensure `package.json` is valid. You should see your plugin ID printed with no errors.

```bash
node -p "require('./package.json').name"
```

### 4. Install Dependencies

#### 4.1. Action

```bash
npm install --save-dev dotenv esbuild gts obsidian typescript builtin-modules
```

#### 4.2. Commit

Now, stage and commit the changes with the message 'npm install --save-dev dotenv esbuild gts obsidian typescript builtin-modules'.

#### 4.3. Verification

The `npm install` command should have completed without errors. You should also see a `node_modules` directory and a `package-lock.json` file.

```bash
ls -d node_modules package-lock.json
```

### 5. Initialize GTS

#### 5.1. Action

```bash
# Initialize Google TypeScript Style (creates tsconfig.json, .eslintrc.json, .prettierrc.js, and more)
npx gts init --yes
```

#### 5.2. Commit

Now, stage and commit the changes with the message 'npx gts init --yes'. Include package-lock.json if it was modified.

#### 5.3. Verification

Check that the GTS configuration files were created.

```bash
ls .eslintrc.json tsconfig.json .prettierrc.js
```

### 6. Add and revise scripts in package.json

#### 6.1. Action

Edit package.json to include this block:

```json
{
  …
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "lint": "NODE_OPTIONS=\"--no-deprecation\" gts lint && prettier --check \"*.{css,md}\" \"src/**/*.{css,md}\"",
    "clean": "gts clean",
    "compile": "tsc",
    "fix": "NODE_OPTIONS=\"--no-deprecation\" gts fix && prettier --write \"*.{css,md}\" \"src/**/*.{css,md}\"",
    "prepare": "npm run compile",
    "test": "node --test --experimental-test-module-mocks build/test/*.test.js build/test/**/*.test.js",
    "pretest": "npm run compile",
    "posttest": "npm run lint",
    "package": "npm run build && cd build && zip -r [PLUGIN_ID].zip index.js manifest.json styles.css",
    "deploy_local": "node scripts/deploy-local.mjs"
  },
  …
}
```

#### 6.2. Commit

Now, stage and commit the changes with the message 'add scripts package.json'.

#### 6.3. Verification

Run the `clean` script to verify the scripts are working.

```bash
npm run clean
```

### 7. Customize Generated Configuration Files

The `npx gts init` command creates several configuration files. You'll need to customize some of them:

#### 7.1. Action

**Update `.eslintrc.json`** to allow importing 'obsidian':

```json
{
  …
  "rules": {
    "n/no-unpublished-import": ["error", {"allowModules": ["obsidian"]}]
  }
  …
}
```

#### 7.2. Commit

Now, stage and commit the changes with the message 'configure eslint'.

#### 7.3. Verification

Run the linter. It's okay if it reports that no files were checked.

```bash
npm run lint
```

#### 7.4. Action

**Update `tsconfig.json`** for Obsidian plugin development:

```json
{
  "extends": "./node_modules/gts/tsconfig-google.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "build",
    "lib": ["DOM", "ES2022"],
    "target": "ES2022",
    "moduleResolution": "node",
    "isolatedModules": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

#### 7.5. Commit

Now, stage and commit the changes with the message 'configure typescript'.

#### 7.6. Verification

Run the TypeScript compiler. It should report no errors, even if no source files are present yet.

```bash
npm run compile
```

### 8. Update EditorConfig

#### 8.1. Action

Note: GTS already created `.editorconfig`. Verify it contains:

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
insert_final_newline = true
```

#### 8.2. Commit

If any changes were necessary, stage and commit the changes with the message 'configure editor'.

### 9. Create Build and Deploy Scripts

#### 9.1. Action

Create `esbuild.config.mjs` (this is a hand-written configuration file specific to your project):

```javascript
import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { copyFile, mkdir } from "fs/promises";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = process.argv[2] === "production";

const copyPlugin = {
  name: "copy-files",
  setup(build) {
    build.onEnd(async () => {
      await mkdir("build", { recursive: true });
      await copyFile("src/manifest.json", "build/manifest.json");
      await copyFile("src/styles.css", "build/styles.css");
    });
  },
};

const context = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ["src/index.ts"],
  bundle: true,
  external: ["obsidian", "electron", ...builtins],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "build/index.js",
  minify: prod,
  plugins: [copyPlugin],
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

#### 9.2. Action

Create `scripts/deploy-local.mjs`:

```javascript
#!/usr/bin/env node

import "dotenv/config";
import { copyFileSync, mkdirSync } from "fs";
import { join } from "path";

const pluginDir = process.env.OBSIDIAN_PLUGIN_PATH;
if (!pluginDir) {
  console.error("Please set OBSIDIAN_PLUGIN_PATH in .env file");
  process.exit(1);
}
mkdirSync(pluginDir, { recursive: true });

["index.js", "manifest.json", "styles.css"].forEach((file) => {
  const src = join("build", file);
  const dest = join(pluginDir, file);
  copyFileSync(src, dest);
});

console.log("Deployed to", pluginDir);
```

#### 9.3. Commit

Now, stage and commit the changes with the message 'create build and deploy scripts'.

### 10. Create Plugin Source Files

#### 10.1. Action

Create `src/manifest.json`:

```json
{
  "id": "[PLUGIN_ID]",
  "name": "[PLUGIN_NAME]",
  "version": "1.0.0",
  "description": "[PLUGIN_DESCRIPTION]",
  "author": "[AUTHOR_NAME]",
  "authorUrl": "[AUTHOR_URL]",
  "isDesktopOnly": false
}
```

#### 10.2. Action

Create an empty file at `src/styles.css`

#### 10.3. Action

Create `src/index.ts`:

```typescript
import {Plugin} from 'obsidian';

export default class [PLUGIN_NAME]Plugin extends Plugin {
  override async onload() {
    console.log('Loading [PLUGIN_NAME]');
  }

  override onunload() {
    console.log('Unloading [PLUGIN_NAME]');
  }
}
```

#### 10.4. Commit

Now, stage and commit the changes with the message 'create plugin source files'.

#### 10.5. Verification

Test the build system. This will compile the source code and copy artifacts to the `build` directory.

```bash
npm run build
```

### 11. Set Up Git Hooks

#### 11.1. Action

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm run fix
```

#### 11.2. Action

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

#### 11.3. Commit

Now, stage and commit the changes with the message 'set up pre-commit hook'.

### 12. Set Up Local Development Environment

#### 12.1. Action

Create `.env` file:

```
OBSIDIAN_PLUGIN_PATH=[VAULT_PATH]/.obsidian/plugins/[PLUGIN_ID]
```

#### 12.2. Commit

Now, stage and commit the changes with the message 'create .env file'.

#### 12.3. Verification

Test the local deployment script. This requires the `build` directory to exist from the previous step.

```bash
npm run deploy_local
```

### 13. Create Basic Test

#### 13.1. Action

Create `test/index.test.ts`:

```typescript
import { test } from "node:test";
import * as assert from "node:assert";

void test("basic test infrastructure works", () => {
  // Basic test to verify test infrastructure works
  assert.equal(1 + 1, 2);
});
```

#### 13.2. Commit

Now, stage and commit the changes with the message 'create basic test'.

#### 13.3. Verification

Run the tests.

```bash
npm run test
```

### 14. Create README.md

#### 14.1. Action

Compose a standard README.md based on what you can glean about the project. Add the sections that are commonly found in a GitHub project.

#### 14.2. Commit

Now, stage and commit the changes with the message 'create README.md'.

## Notes

- Throughout this document, placeholders are marked with `[BRACKETS]` - replace these with your actual values
- The NODE_OPTIONS flag suppresses deprecation warnings from the gts dependency (see [gts PR #928](https://github.com/google/gts/pull/928))
