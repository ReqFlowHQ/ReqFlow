const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const DIST = path.resolve(__dirname, "dist");

if (!fs.existsSync(DIST)) {
  console.error("❌ dist folder not found:", DIST);
  process.exit(1);
}

console.log("✅ Serving frontend from:", DIST);

// Serve static files FIRST (OG images, assets, etc.)
app.use(express.static(DIST));

// ✅ EXPRESS 5–SAFE SPA FALLBACK (REGEX)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(DIST, "index.html"));
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Frontend listening on ${PORT}`);
});

