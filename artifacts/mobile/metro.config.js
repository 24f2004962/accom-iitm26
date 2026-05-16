const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ─── Monorepo support (local dev / Replit only) ────────────────────────────────
// In EAS builds the project is extracted to an isolated /home/expo/workingdir/build/
// directory — the workspace root doesn't exist there, so we gate these settings.
const isWorkspace = fs.existsSync(path.join(workspaceRoot, "pnpm-workspace.yaml"));
if (isWorkspace) {
  config.watchFolders = [workspaceRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ];
}

// ─── pnpm symlink / EAS entry-point fix ───────────────────────────────────────
// pnpm stores packages inside a deep virtual store:
//   node_modules/.pnpm/expo@55.x/node_modules/expo/AppEntry.js
// AppEntry.js does:  import App from '../../App'
// That resolves to the pnpm store parent, NOT the project root — breaking builds.
//
// Strategy: intercept the broken resolution and redirect it to expo-router's
// correct entry file.  We try entry-classic first (SDK 52/53 compat shim),
// then plain entry (SDK 55+), and wrap both in try-catch so a missing export
// never crashes this config file (which would silently disable the interceptor).
let EXPO_ROUTER_ENTRY = null;
try {
  EXPO_ROUTER_ENTRY = require.resolve("expo-router/entry-classic");
} catch (_) {
  try {
    EXPO_ROUTER_ENTRY = require.resolve("expo-router/entry");
  } catch (_2) {
    // Will be caught by the null-guard in resolveRequest below
    console.warn("[metro.config] Could not resolve expo-router entry — pnpm fix disabled.");
  }
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    EXPO_ROUTER_ENTRY &&
    moduleName === "../../App" &&
    typeof context.originModulePath === "string" &&
    context.originModulePath.includes("/expo/AppEntry")
  ) {
    return { type: "sourceFile", filePath: EXPO_ROUTER_ENTRY };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
