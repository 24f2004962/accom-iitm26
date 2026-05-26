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

// ─── pnpm / EAS entry-point fix ───────────────────────────────────────────────
// When Expo Go (or EAS) requests the bundle, `expo/AppEntry.js` tries to import
// `../../App` which doesn't exist in an expo-router project. Intercept and
// redirect to `expo-router/entry` directly using require.resolve so the lookup
// runs in our Metro process (not on the device) where node_modules are present.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "../../App" &&
    typeof context.originModulePath === "string" &&
    context.originModulePath.includes("AppEntry")
  ) {
    const searchPaths = [projectRoot, workspaceRoot].filter((p) =>
      fs.existsSync(path.join(p, "node_modules"))
    );
    for (const base of searchPaths) {
      try {
        const resolved = require.resolve("expo-router/entry", { paths: [base] });
        console.log("[metro] Redirected AppEntry → expo-router/entry:", resolved);
        return { type: "sourceFile", filePath: resolved };
      } catch (_) {}
    }
    console.error("[metro] Could not resolve expo-router/entry — falling back.");
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
