const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");
const http = require("http");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ─── Monorepo support (local dev / Replit only) ────────────────────────────────
const isWorkspace = fs.existsSync(path.join(workspaceRoot, "pnpm-workspace.yaml"));
if (isWorkspace) {
  config.watchFolders = [workspaceRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ];
}

// ─── pnpm deep-store / EAS entry-point fix ────────────────────────────────────
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isAppEntryImport =
    moduleName === "../../App" &&
    typeof context.originModulePath === "string" &&
    context.originModulePath.includes("AppEntry");

  if (isAppEntryImport) {
    const projectRootContext = {
      ...context,
      originModulePath: path.join(projectRoot, "__entry_shim__.js"),
    };

    const candidates = ["expo-router/entry-classic", "expo-router/entry"];
    for (const candidate of candidates) {
      try {
        return projectRootContext.resolveRequest(projectRootContext, candidate, platform);
      } catch (_) {}
    }

    const resolvePaths = [projectRoot, workspaceRoot].filter(
      (p) => fs.existsSync(path.join(p, "node_modules"))
    );
    for (const candidate of candidates) {
      for (const basePath of resolvePaths) {
        try {
          const resolved = require.resolve(candidate, { paths: [basePath] });
          return { type: "sourceFile", filePath: resolved };
        } catch (_) {}
      }
    }

    console.error(
      "[metro.config] Could not resolve expo-router entry — falling back to default resolution."
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

// ─── API proxy middleware for Expo web (dev only) ─────────────────────────────
// Proxies /api/* requests from the Metro web dev server (port 8099) to the
// Express backend (port 8080) so sign-in and all API calls work in Replit.
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    if (req.url && req.url.startsWith("/api")) {
      const options = {
        hostname: "127.0.0.1",
        port: 8080,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: "127.0.0.1:8080" },
      };

      const proxy = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      proxy.on("error", (err) => {
        console.error("[metro proxy] Error proxying", req.url, err.message);
        res.writeHead(502);
        res.end("Backend unavailable");
      });

      req.pipe(proxy, { end: true });
      return;
    }
    return middleware(req, res, next);
  };
};

module.exports = config;
