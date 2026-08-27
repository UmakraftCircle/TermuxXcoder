import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "0.2.0" });
});

app.post("/api/verify-build", (_req, res) => {
  res.json({
    status: "not-run",
    message: "Build verification is not implemented in this prototype. No synthetic success is reported.",
    checks: [],
    readinessScore: null,
  });
});

app.get("/api/system-diagnostics", (_req, res) => {
  res.json({
    status: "not-run",
    message: "Diagnostics are not implemented. No synthetic status is reported.",
    items: [],
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "not-found", path: req.path });
});

app.listen(PORT, () => {
  console.log(`TermuxXCoder server listening on :${PORT}`);
});
