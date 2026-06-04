import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import analysisRoutes from "./routes/analysisRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "Thai Stock Investment Web",
    migration: "node-web-app",
  });
});

app.use("/api", authRoutes);
app.use("/api", analysisRoutes);

app.listen(port, () => {
  console.log(`Thai Stock Investment Web is running at http://localhost:${port}`);
});
