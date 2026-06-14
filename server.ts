import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } catch (error) {
    console.error("Error initializing Gemini API client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined in the environment. AI features will fallback to client-side heuristics.");
}

// API: Check status of server & AI capabilities
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    aiEnabled: !!aiClient,
  });
});

// API: AI-powered smart suggestions based on current tasks
app.post("/api/ai/suggest", async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({ error: "Gemini API client is not configured or available." });
    }

    const { currentTasks = [], focusCategory = "" } = req.body;

    const taskListSnippet = currentTasks.length > 0 
      ? currentTasks.map((t: any) => `- [${t.completed ? 'completed' : 'pending'}] ${t.title} (${t.category}, Priority: ${t.priority})`).join("\n")
      : "No tasks currently in the list.";

    const prompt = `Based on the user's current to-do list, suggest exactly 3 high-value, highly actionable, realistic tasks they should consider adding next to maintain high productivity.
    ${focusCategory ? `The user wants to focus especially on the category: "${focusCategory}".` : "Provide a well-rounded set of suggestions."}
    
    Here is their current task list:
    ${taskListSnippet}

    Suggest exactly 3 tasks. Keep titles short and elegant (2-5 words), and descriptions practical and encouraging.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite productivity coach who analyzes to-do lists and suggests highly optimized next steps. Balance low, medium, and high priorities.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of 3 recommended tasks",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short actionable task title." },
              description: { type: Type.STRING, description: "Helpful details on why or how to accomplish this task." },
              priority: { type: Type.STRING, description: "Recommendation for priority: low, medium, or high." },
              category: { type: Type.STRING, description: "Category tag: Work, Personal, Health, Finance, Learning, or General." }
            },
            required: ["title", "description", "priority", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }

    const suggestions = JSON.parse(text);
    res.json({ suggestions });
  } catch (error: any) {
    console.error("Error in /api/ai/suggest:", error);
    res.status(500).json({ error: "Failed to generate suggestions: " + (error.message || error) });
  }
});

// API: Smart text parsing for quick/voice shorthand input
// Resolves relative expressions like "by tomorrow", "next Monday" using client's local time
app.post("/api/ai/parse-input", async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({ error: "Gemini API client is not configured or available." });
    }

    const { rawInput, localDateStr } = req.body;
    if (!rawInput) {
      return res.status(400).json({ error: "Missing rawInput parameter." });
    }

    const prompt = `Translate the raw text expression into a structured individual task.
    The user's local date/time is: ${localDateStr || "Sunday, June 14, 2026"}. Use this date as reference for relative days (e.g. tomorrow, next Tuesday, in 3 days, today, Friday).
    
    Raw text: "${rawInput}"

    Extract:
    1. A neat Title (cleaned of dates and priority words if possible).
    2. A short Description (or leave empty if no additional details found).
    3. DueDate resolved exactly as YYYY-MM-DD. If no due date is inferred, set it to the empty string "".
    4. Priority: low, medium, or high. Infer low/high from words like "urgent", "important", "ASAP" (high) or "casual", "whenever" (low). Default is medium.
    5. Category: Work, Personal, Health, Finance, Learning, or General.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a precise task language interpreter. Resolve relative timelines accurately against the reference date and return clean structured tasks.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Clean task title." },
            description: { type: Type.STRING, description: "Extracted details or blank." },
            dueDate: { type: Type.STRING, description: "Resolved due date in YYYY-MM-DD or empty string." },
            priority: { type: Type.STRING, description: "Task priority: low, medium, or high." },
            category: { type: Type.STRING, description: "Category name: Work, Personal, Health, Finance, Learning, or General." }
          },
          required: ["title", "description", "dueDate", "priority", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }

    const task = JSON.parse(text);
    res.json({ task });
  } catch (error: any) {
    console.error("Error in /api/ai/parse-input:", error);
    res.status(500).json({ error: "Failed to parse task input: " + (error.message || error) });
  }
});

// Setup Vite Dev Middleware / Static Hosting
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started. Visual interface running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Error setting up server with Vite:", err);
});
