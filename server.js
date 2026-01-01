const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const SYSTEM_PROMPT = require("./systemPrompt");

const app = express();

// CORS: easiest dev setting (allow all). If you want to restrict later,
// set FRONTEND_ORIGIN to your GitHub Pages URL (e.g., https://user.github.io)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * Main endpoint expected by the GitHub Pages frontend
 * POST /api/mentor-feedback
 */
app.post("/api/mentor-feedback", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set" });
    }

    const body = req.body || {};
    const { messages = [], instruction = "", observations = {} } = body;

    // Frontend uses roles: user | mentor
    // OpenAI uses roles: user | assistant
    const normalizedMessages = (messages || []).map((m) => ({
      role: m.role === "mentor" ? "assistant" : "user",
      content: String(m.content || "")
    }));

    // If there is no user content, build a fallback user message from observations
    const hasUserContent = normalizedMessages.some(
      (m) => m.role === "user" && m.content.trim()
    );

    const fallbackUser = hasUserContent
      ? null
      : {
          role: "user",
          content: [
            instruction || "",
            "",
            "OBSERVATIONS:",
            `Attending: ${observations.dikkate_alma || ""}`,
            `Interpreting: ${observations.yorumlama || ""}`,
            `Responding: ${observations.karar_verme || ""}`
          ].join("\n")
        };

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...(fallbackUser ? [fallbackUser] : []),
        ...normalizedMessages
      ]
    });

    const text = completion.choices?.[0]?.message?.content || "";
    return res.json({ feedback: text });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Server error", detail: String(err?.message || err) });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server listening on", port));
