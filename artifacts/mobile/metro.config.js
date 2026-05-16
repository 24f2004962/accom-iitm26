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
// Intercept that specific import and redirect it to expo-router/entry-classic
// so the correct entry point is always used regardless of node_modules layout.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "../../App" &&
    typeof context.originModulePath === "string" &&
    context.originModulePath.includes("/expo/AppEntry")
  ) {
    return context.resolveRequest(context, "expo-router/entry-classic", platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
