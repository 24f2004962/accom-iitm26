const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ─── Monorepo support ─────────────────────────────────────────────────────────
const isWorkspace = fs.existsSync(path.join(workspaceRoot, "pnpm-workspace.yaml"));
if (isWorkspace) {
  config.watchFolders = [workspaceRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ];
}

// ─── Entry-point fix (pnpm symlinks + EAS cloud builds) ───────────────────────
// pnpm resolves symlinks so "../../App" from inside the pnpm virtual store
// (node_modules/.pnpm/expo@.../node_modules/expo/AppEntry.js) points deep into
// the store, not the project root.  Intercept it and redirect straight to
// App.js which lives next to this config file in every environment (local
// Metro, expo start --tunnel, EAS cloud build at /home/expo/workingdir/build/).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "../../App" &&
    typeof context.originModulePath === "string" &&
    context.originModulePath.includes("AppEntry")
  ) {
    const appJsPath = path.join(projectRoot, "App.js");
    if (fs.existsSync(appJsPath)) {
      return { type: "sourceFile", filePath: appJsPath };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
