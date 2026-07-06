import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import analysisRoutes from "./routes/analysisRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { getDecisionEngineConfig } from "./services/decisionEngineConfigService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(express.json({
    limit: "2mb",
    verify: (req, _res, buffer) => {
      if (req.originalUrl?.startsWith("/api/payment/webhook/")) {
        req.rawBody = buffer.toString("utf8");
      }
    },
  }));
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    if (["/", "/index.html", "/app.js"].includes(req.path)) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
    next();
  });
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      app: "Thai Stock Investment Web",
      migration: "node-web-app",
      decisionEngine: getDecisionEngineConfig(),
    });
  });

  app.use("/api", authRoutes);
  app.use("/api", analysisRoutes);

  return app;
}

export function startServer(options = {}) {
  const port = options.port ?? process.env.PORT ?? 3000;
  const app = options.app || createApp();
  const server = app.listen(port, () => {
    if (!options.silent) {
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : port;
      console.log(`Thai Stock Investment Web is running at http://localhost:${resolvedPort}`);
    }
  });

  return server;
}

const directRunPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (directRunPath === __filename) {
  startServer();
}
