// ✅ Set EXPO_PUBLIC_API_URL env var (in Replit secrets or EAS build env)
// to your Railway deployed URL, e.g. "https://campusops.up.railway.app/api"
// If not set, falls back to the value below.
const PROD_API = process.env.EXPO_PUBLIC_API_URL || "https://accom-iitm-production.up.railway.app/api";

module.exports = function applyAppConfig({ config }) {
  const proxyUrl = process.env.EXPO_PUBLIC_WEB_ORIGIN || "https://localhost";

  return {
    ...config,
    plugins: (config.plugins || []).map((plugin) => {
      if (Array.isArray(plugin) && plugin[0] === "expo-router") {
        return [plugin[0], { ...plugin[1], origin: proxyUrl }];
      }
      return plugin;
    }),
    extra: {
      ...config.extra,
      apiUrl: PROD_API,
      router: {
        ...config.extra?.router,
        origin: proxyUrl,
        headOrigin: proxyUrl,
      },
    },
  };
};
