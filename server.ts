import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "TermuxXCoder GitHub & APK Studio" });
  });

  // AI assistant route for Android / Gradle / GitHub Actions customization
  app.post("/api/ai-assist", async (req, res) => {
    try {
      const { prompt, currentFile, context } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(200).json({
          reply: `To use live AI code suggestions, configure GEMINI_API_KEY in the Secrets panel. For now, using built-in high-performance template generation.\n\nRecommended configuration for "${prompt}": Verify your JDK 21 setup and ensure JGit and Sora Editor 0.23.5 dependencies are synchronized in gradle/libs.versions.toml.`,
          fallback: true
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an expert Android Native & GitHub Actions DevOps Engineer specializing in TermuxXCoder (Modular Android IDE combining Sora Editor, Embedded Termux PTY, SAF, JGit, LSP, DAP, and GGUF llama.cpp).
Context: ${context || "TermuxXCoder Build Prep"}
Current active file: ${currentFile || "None"}
User Request: ${prompt}

Provide a concise, practical, production-ready solution with code/yaml snippets if applicable.`
              }
            ]
          }
        ]
      });

      res.json({ reply: response.text || "No response generated." });
    } catch (err: any) {
      console.error("AI assist error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI assist response" });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TermuxXCoder Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
