const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

// Workspace root (this file's directory)
const workspaceRoot = __dirname;
// The actual Expo app lives in artifacts/mobile
const mobileRoot = path.join(workspaceRoot, "artifacts", "mobile");
const appRoot = fs.existsSync(path.join(mobileRoot, "app.json")) ? mobileRoot : workspaceRoot;

const config = getDefaultConfig(appRoot);

// Watch everything from the workspace root
config.watchFolders = [workspaceRoot];

// Search node_modules in both workspace root and mobile dir
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(mobileRoot, "node_modules"),
].filter((p) => fs.existsSync(p));

// ─── Entry-point fix ──────────────────────────────────────────────────────────
// pnpm symlink resolution makes expo/AppEntry.js try to import "../../App"
// relative to the pnpm virtual store (.pnpm/expo@.../), not the project root.
// Intercept and redirect straight to App.js next to this config file.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "../../App" &&
    typeof context.originModulePath === "string" &&
    context.originModulePath.includes("AppEntry")
  ) {
    for (const dir of [workspaceRoot, mobileRoot]) {
      const appJs = path.join(dir, "App.js");
      if (fs.existsSync(appJs)) {
        return { type: "sourceFile", filePath: appJs };
      }
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
