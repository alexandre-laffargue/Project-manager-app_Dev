const dotenv = require("dotenv");
const app = require("./app");
const { connectDB } = require("./config/db");
const fs = require("fs");
const path = require("path");

dotenv.config();

// If Docker secrets are used, the secret will be available at /run/secrets/jwt_secret
// Prefer the secret file over the env var if present (more secure in orchestrators).
try {
  const secretPath = path.join("/run/secrets", "jwt_secret");
  if (fs.existsSync(secretPath)) {
    const s = fs.readFileSync(secretPath, "utf8").trim();
    if (s) process.env.JWT_SECRET = s;
  }
} catch (e) {
  // non-fatal; fallback to existing process.env values
}

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[server] failed to start:", err);
    process.exit(1);
  }
}

bootstrap();
