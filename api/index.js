const { app } = require("../server.js");

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
  return app(req, res);
};

