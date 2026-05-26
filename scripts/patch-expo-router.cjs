#!/usr/bin/env node
/**
 * Post-install patches:
 *
 * 1. expo-router internal shims
 *    Adds internal/routing.js and internal/testing.js stubs required by
 *    @expo/router-server@55 but missing from expo-router@6.0.x.
 *
 * 2. expo/AppEntry.js pnpm-symlink fix
 *    AppEntry.js does `import App from '../../App'`.  Under pnpm the file's
 *    real path is node_modules/.pnpm/expo@55.x/.../expo/AppEntry.js so
 *    '../../App' resolves TWO directories above the expo package — deep inside
 *    the pnpm virtual store — not to the project root.
 *    We rewrite the import to pull the App component directly from
 *    expo-router/build/qualified-entry, which is where expo-router already
 *    puts it.
 */
const fs = require("fs");
const path = require("path");

const pnpmStore = path.join(__dirname, "../node_modules/.pnpm");

// ─── 1. expo-router internal shims ───────────────────────────────────────────

const ROUTING_SHIM = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchers = require("../build/matchers");
exports.isTypedRoute = matchers.isTypedRoute;
`;

const TESTING_SHIM = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contextStubs = require("../build/testing-library/context-stubs");
exports.requireContext = contextStubs.requireContext;
exports.requireContextWithOverrides = contextStubs.requireContextWithOverrides;
`;

if (!fs.existsSync(pnpmStore)) {
  console.log("[patch-expo-router] pnpm store not found, skipping patches.");
  process.exit(0);
}

const entries = fs.readdirSync(pnpmStore);

const routerDirs = entries.filter((e) => e.startsWith("expo-router@6."));
if (routerDirs.length === 0) {
  console.log("[patch-expo-router] No expo-router@6 found, skipping router shim.");
} else {
  for (const dir of routerDirs) {
    const routerPath = path.join(pnpmStore, dir, "node_modules", "expo-router");
    const internalDir = path.join(routerPath, "internal");
    if (!fs.existsSync(routerPath)) continue;
    fs.mkdirSync(internalDir, { recursive: true });
    fs.writeFileSync(path.join(internalDir, "routing.js"), ROUTING_SHIM);
    fs.writeFileSync(path.join(internalDir, "testing.js"), TESTING_SHIM);
    console.log(`[patch-expo-router] Router shim patched: ${dir}`);
  }
}

// ─── 2. expo/AppEntry.js pnpm-symlink fix ────────────────────────────────────
//
// Replace the broken relative import with a direct named import from the
// same module that App.js re-exports.  Works identically in:
//   • local pnpm dev  (expo start --tunnel)
//   • EAS cloud build (pnpm install → postinstall → expo export:embed)

const APPENTRY_OLD = `import App from '../../App';`;

const APPENTRY_NEW = `// [patched by scripts/patch-expo-router.cjs]
// pnpm symlinks make '../../App' resolve inside the virtual store, not the
// project root.  Import the App component directly from expo-router instead.
import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';`;

const expoDirs = entries.filter((e) => e.startsWith("expo@55."));
let appEntryPatched = 0;

for (const dir of expoDirs) {
  const appEntryPath = path.join(pnpmStore, dir, "node_modules", "expo", "AppEntry.js");
  if (!fs.existsSync(appEntryPath)) continue;

  let content = fs.readFileSync(appEntryPath, "utf8");
  if (content.includes(APPENTRY_OLD)) {
    content = content.replace(APPENTRY_OLD, APPENTRY_NEW);
    fs.writeFileSync(appEntryPath, content, "utf8");
    console.log(`[patch-expo-router] AppEntry.js patched: ${dir}`);
    appEntryPatched++;
  } else if (content.includes("qualified-entry")) {
    console.log(`[patch-expo-router] AppEntry.js already patched: ${dir}`);
    appEntryPatched++;
  }
}

if (appEntryPatched === 0) {
  console.log("[patch-expo-router] No expo@55 AppEntry.js found to patch.");
}
