import dotenv from "dotenv";
import { createApp } from "./app";
import buildInfo from "./build-info.json";
import { initializeDataLayer } from "./data/bootstrap";

dotenv.config({ path: __dirname + "/../.env" });
const PORT = process.env.PORT || 5000;
const bootstrap = async () => {
  try {
    const repositories = await initializeDataLayer();
    const app = createApp(repositories);
    console.log(
      `🔖 ReqFlow backend version=${buildInfo.version} buildTime=${buildInfo.buildTime}`
    );
    app.listen(PORT, () =>
      console.log(
        `✅ ReqFlow backend running on http://localhost:${PORT} using ${repositories.driver}`
      )
    );
  } catch (error) {
    console.error("🚨 Backend bootstrap failed:", error);
    process.exit(1);
  }
};

void bootstrap();
