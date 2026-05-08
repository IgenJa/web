module.exports = (req, res) => {
  // Vercel rewrite esetén az eredeti útvonalat query-ben adjuk át: ?path=/posts/123
  // Expressnek visszaadjuk az eredeti URL-t, hogy a route-ok illeszkedjenek.
  try {
    const url = new URL(req.url, "http://localhost");
    const originalPath = url.searchParams.get("path");
    if (originalPath) {
      req.url = originalPath;
    }
  } catch {
    // ignore
  }

  // Lazy-load, hogy a betöltési hibát el tudjuk kapni és ki tudjuk logolni.
  try {
    if (!global.__cachedExpressApp) {
      // eslint-disable-next-line global-require
      global.__cachedExpressApp = require("../server.js").app;
    }
    return global.__cachedExpressApp(req, res);
  } catch (err) {
    console.error("Failed to load server.js (Vercel function):", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Backend init hiba Vercelen (nézd meg a Function Logs-ot).", details: String(err?.message || err) }));
  }
};

