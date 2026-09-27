import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini client helper
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiAvailable: Boolean(process.env.GEMINI_API_KEY) });
});

// AI Screenplay Formatter Endpoint ("Format with AI")
app.post("/api/ai/format", async (req, res) => {
  try {
    const { rawText, context } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY no está configurada en el servidor.",
      });
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        error: "El texto a formatear está vacío.",
      });
    }

    const systemInstruction = `You are a professional screenwriting assistant. Your only task is to take the provided raw, unformatted text and structure it strictly into standard cinematic screenplay format. Do not alter, expand, rewrite, or invent story elements, plot lines, or dialogue content—only clean up and format what is given.

Classify and map every line or paragraph into one of these specific script elements:

Act (e.g., Acto I)

Scene Title (Scene headings like INT./EXT. LOCATION - TIME)

Action (Visual descriptions)

Character (Character names in uppercase)

Dialogue (Spoken lines)

Parenthetical (Actor instructions inside parentheses)

Transition (Cuts, fades, e.g., CUT TO:)

Shot (Camera angles and shot descriptions)

Text (General notes or blocks)

Return the clean, structured blocks sequentially so they can seamlessly replace the unformatted text in the editor.`;

    const userPrompt = `Format and structure the following raw text into cinematic screenplay blocks:

${rawText}

${context ? `Additional context: ${context}` : ''}`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blocks: {
              type: Type.ARRAY,
              description: "The sequential list of cleanly formatted screenplay blocks",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Element type: act, scene_heading, action, character, dialogue, parenthetical, transition, shot, or text",
                  },
                  content: {
                    type: Type.STRING,
                    description: "Formatted content for this screenplay block",
                  },
                },
                required: ["type", "content"],
              },
            },
          },
          required: ["blocks"],
        },
        temperature: 0.2,
      },
    });

    let rawOutput = response.text || "{}";
    let parsed: { blocks?: Array<{ type: string; content: string }> } = {};

    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      // Clean possible markdown code blocks if any
      const cleaned = rawOutput.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }

    const typeMapping: Record<string, string> = {
      act: "act",
      acto: "act",
      "scene title": "scene_heading",
      scene_heading: "scene_heading",
      scene: "scene_heading",
      heading: "scene_heading",
      slugline: "scene_heading",
      action: "action",
      acción: "action",
      character: "character",
      personaje: "character",
      dialogue: "dialogue",
      diálogo: "dialogue",
      parenthetical: "parenthetical",
      acotación: "parenthetical",
      parenthesis: "parenthetical",
      transition: "transition",
      transición: "transition",
      corte: "transition",
      shot: "shot",
      plano: "shot",
      toma: "shot",
      text: "text",
      texto: "text",
      note: "text",
    };

    const validatedBlocks = (parsed.blocks || []).map((b) => {
      const normalizedTypeKey = (b.type || "").toLowerCase().trim();
      const mappedType = typeMapping[normalizedTypeKey] || "action";
      return {
        type: mappedType,
        content: (b.content || "").trim(),
      };
    }).filter((b) => b.content.length > 0);

    res.json({ blocks: validatedBlocks });
  } catch (error: any) {
    console.error("AI Format Error:", error);
    res.status(500).json({ error: error.message || "Error al formatear el guion con IA." });
  }
});

// AI Screenplay Assistant Endpoint
app.post("/api/ai/assist", async (req, res) => {
  try {
    const { action, currentScript, prompt, character, location } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY no está configurada en las variables de entorno.",
      });
    }

    let systemPrompt = `Eres un guionista y asesor cinematográfico profesional (Script Doctor) especializado en formato de guion estándar (Screenplay Industry Standard).
REGLA CRUCIAL DE FORMATO OBLIGATORIO:
1. Todos los NOMBRES DE PERSONAJES deben estar en MAYÚSCULAS y en **NEGRITA** (ej: **MARÍA**, **JUAN (V.O.)**).
2. Todos los ENCABEZADOS DE ESCENA / LUGARES DE GRABACIÓN deben estar en MAYÚSCULAS y en **NEGRITA** comenzando con INT. o EXT. (ej: **INT. CAFETERÍA - DÍA**, **EXT. CALLE LLUVIOSA - NOCHE**).
3. Los diálogos van debajo del personaje correspondiente.
4. Las acotaciones / paréntesis van entre paréntesis (ej: (nerviosa), (susurrando)).
5. Las transiciones en **NEGRITA** a la derecha (ej: **CORTE A:**, **FUNDIDO A NEGRO:**).
6. Responde en español y mantén una calidad cinematográfica brillante, ritmo ágil y diálogos naturales y cargados de subtexto.`;

    let userPrompt = "";

    if (action === "continue_scene") {
      userPrompt = `Continúa la siguiente escena del guion manteniendo la coherencia de tono y personajes.
Escribe entre 2 y 4 bloques nuevos (acción, personajes en **NEGRITA**, diálogos o transiciones).

Guion actual:
${currentScript || ""}

Instrucción adicional del autor: ${prompt || "Continúa la acción de forma orgánica y dramática."}`;
    } else if (action === "suggest_dialogue") {
      userPrompt = `Sugiere 3 opciones alternativas de diálogo para el personaje **${character || "PERSONAJE"}** en el contexto de esta escena:

Contexto del guion:
${currentScript || ""}

Pauta del diálogo: ${prompt || "Un diálogo con fuerte subtexto emocional y tensión dramática."}

Para cada opción devuelve el formato:
Opción X:
**${character || "PERSONAJE"}**
(acotación opcional)
Diálogo aquí.`;
    } else if (action === "generate_scene") {
      userPrompt = `Crea una escena cinematográfica completa en formato estándar de guion para la locación **${location || "INT. OFICINA - NOCHE"}** con los personajes solicitados.
Descripción / Trama: ${prompt || "Una confrontación inesperada."}

Recuerda:
- Encabezado con locación en **NEGRITA** (ej: **${location || "INT. HABITACIÓN - DÍA"}**)
- Párrafos de acción claros y visuales
- Nombres de personajes en **NEGRITA** antes de cada diálogo
- Acotaciones entre paréntesis
- Transición final`;
    } else if (action === "doctor_review") {
      userPrompt = `Realiza un análisis de Script Doctor profesional para el siguiente fragmento de guion.
Evalúa:
1. Formato (personajes en negrita, locaciones INT/EXT en negrita)
2. Ritmo dramático y fluidez de lectura
3. Fuerza y autenticidad de los diálogos
4. Identificación de lugares de rodaje y necesidades de producción
5. Tres sugerencias concretas de mejora cinematográfica.

Guion a evaluar:
${currentScript || ""}`;
    } else {
      userPrompt = `${prompt || "Ayuda a pulir este guion"}

Guion de referencia:
${currentScript || ""}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("AI Assist Error:", error);
    res.status(500).json({ error: error.message || "Error al procesar la solicitud con IA." });
  }
});

// Vite middleware & Production static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`GuionStudio server running on http://0.0.0.0:${PORT}`);
  });
}

start();
