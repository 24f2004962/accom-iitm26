const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ─── Monorepo support ─────────────────────────────────────────────────────────
// Watch both the mobile app root and the workspace root (lib/*, etc.)
config.watchFolders = [workspaceRoot];

// Resolve packages from the mobile app's node_modules first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// ─── pnpm symlink fix ─────────────────────────────────────────────────────────
// pnpm stores packages in a deep virtual store (.pnpm/expo@55.x/node_modules/expo/).
// When Metro follows symlinks, it resolves '../../App' from expo/AppEntry.js
// relative to that deep real path instead of the project root — causing build
// failures in EAS / production Android builds.
//
// Pre-resolve expo-router/entry-classic at config load time (relative to this
// file, where node_modules are correctly set up) and return the absolute path
// directly so Metro never needs to re-resolve from the wrong deep pnpm context.
const EXPO_ROUTER_ENTRY = require.resolve("expo-router/entry-classic");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "../../App" &&
    typeof context.originModulePath === "string" &&
    context.originModulePath.includes("/expo/AppEntry")
  ) {
    return { type: "sourceFile", filePath: EXPO_ROUTER_ENTRY };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
