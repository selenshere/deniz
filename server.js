import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

// ✅ CORS + preflight
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ✅ Static frontend
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ❗ POST dışındaki isteklerde HTML değil JSON döndür
app.all("/api/chat", (req, res, next) => {
  if (req.method === "POST") return next();
  return res.status(405).json({ error: "Use POST /api/chat" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { firstName, lastName, messages } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "İsim ve soyisim zorunludur." });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Mesajlar boş olamaz." });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4
    });

    res.json({ assistant: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ✅ SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
