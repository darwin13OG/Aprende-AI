import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High payload limit for image/PDF base64 uploads
app.use(express.json({ limit: '35mb' }));

// In-memory experiences store for sharing & dynamic URLs
const experiencesStore = new Map<string, any>();

// Lazy-initialize Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Mock responses will be used if API is called without key.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper to sanitize HTML to plain text
function sanitizeHtmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract YouTube video ID
function extractYouTubeVideoId(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || parsed.pathname.split('/').pop() || null;
    }
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').trim() || null;
    }
  } catch {
    const match = urlStr.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  }
  return null;
}

// Extract content from Web URL or YouTube
app.post('/api/extract-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'URL requerida' });
    }

    const trimmedUrl = url.trim();
    const ytId = extractYouTubeVideoId(trimmedUrl);

    if (ytId) {
      // YouTube Video handling via oEmbed and metadata
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`);
        let title = 'Video de YouTube';
        let author = 'YouTube Creator';
        if (oembedRes.ok) {
          const oembedData: any = await oembedRes.json();
          title = oembedData.title || title;
          author = oembedData.author_name || author;
        }

        return res.json({
          success: true,
          type: 'youtube',
          videoId: ytId,
          title: `YouTube: ${title}`,
          author,
          extractedText: `Video de YouTube: "${title}" por ${author}. Enlace: ${trimmedUrl}. ID: ${ytId}`,
          url: trimmedUrl,
        });
      } catch (err) {
        return res.json({
          success: true,
          type: 'youtube',
          videoId: ytId,
          title: `Video de YouTube (${ytId})`,
          author: 'YouTube',
          extractedText: `Video de YouTube en ${trimmedUrl}. ID: ${ytId}`,
          url: trimmedUrl,
        });
      }
    }

    // Standard Web Page HTML Text Extraction
    const response = await fetch(trimmedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(400).json({ success: false, message: `No se pudo acceder a la página web (HTTP ${response.status})` });
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : trimmedUrl;

    const cleanText = sanitizeHtmlToText(html).slice(0, 15000);

    return res.json({
      success: true,
      type: 'web',
      title,
      extractedText: cleanText,
      url: trimmedUrl,
    });
  } catch (error: any) {
    console.error('Error extracting URL:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Error al obtener contenido de la URL',
    });
  }
});

// Get stored experience by ID (e.g., /api/experiences/:id)
app.get('/api/experiences/:id', (req, res) => {
  const { id } = req.params;
  const experience = experiencesStore.get(id);
  if (experience) {
    return res.json({ success: true, experience });
  }
  return res.status(404).json({ success: false, message: 'Experiencia no encontrada' });
});

// Save or publish an experience with short clean ID
app.post('/api/experiences', (req, res) => {
  const experience = req.body;
  if (!experience || !experience.tema) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }
  const id = experience.id || `s-${Math.random().toString(36).substring(2, 8)}`;
  experiencesStore.set(id, { ...experience, id });
  res.json({ success: true, id, experience: experiencesStore.get(id) });
});

// Multimodal Generation Endpoint with Model Fallback Cascade
const CASCADE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

app.post('/api/generate', async (req, res) => {
  try {
    const { promptText, topic, fileBase64, fileMimeType, fileName, sources, userApiKey } = req.body;
    const customApiKey = (req.headers['x-gemini-api-key'] as string) || userApiKey;
    const effectiveApiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;

    // Collect all source descriptions
    const inputSourcesList: any[] = Array.isArray(sources) && sources.length > 0 ? sources : [];

    if (fileName || fileBase64) {
      inputSourcesList.push({
        id: `src-${Date.now()}`,
        nombre: fileName || 'Archivo adjunto',
        tipo: fileMimeType?.includes('pdf') ? 'pdf' : fileMimeType?.includes('image') ? 'imagen' : 'texto',
        base64: fileBase64,
        mimeType: fileMimeType,
      });
    }

    const effectiveTopic = topic || promptText || inputSourcesList[0]?.nombre || 'Tema de Estudio';

    if (!effectiveApiKey) {
      return res.status(429).json({
        success: false,
        quotaExhausted: true,
        message: 'Todos los modelos del sistema están saturados o no tienen cuota. Por favor introduce tu propia clave de API de Google Gemini para continuar.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [];

    // Attach base64 files if present
    if (fileBase64 && fileMimeType) {
      parts.push({
        inlineData: {
          mimeType: fileMimeType,
          data: fileBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }

    // Attach any other files from sources array
    for (const src of inputSourcesList) {
      if (src.base64 && src.mimeType && src.base64 !== fileBase64) {
        parts.push({
          inlineData: {
            mimeType: src.mimeType,
            data: src.base64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }
    }

    // Prepare extracted text context from Web, YouTube, or text notes
    let sourcesTextContext = '';
    for (const src of inputSourcesList) {
      if (src.extractedText) {
        sourcesTextContext += `\n\n--- FUENTE: ${src.nombre} (${src.tipo}) ---\n${src.extractedText.slice(0, 10000)}`;
      } else if (src.url) {
        sourcesTextContext += `\n\n--- FUENTE ENLACE: ${src.nombre} ---\nURL: ${src.url}`;
      }
    }

    const sourceCount = Math.max(1, inputSourcesList.length);

    const promptInstruction = `
Actúa como un Diseñador Instruccional Senior y Motor de Aprendizaje Profundo ("Aprende AI"), con la profundidad y rigor de Google NotebookLM.
Tu objetivo es analizar minuciosamente las fuentes proporcionadas por el usuario (documentos, páginas web, transcripciones de YouTube, imágenes o apuntes) y sintetizarlas en un paquete de estudio interactivo de alto rendimiento.

Tema de referencia: ${effectiveTopic}
Instrucción o retroalimentación del usuario: ${promptText || 'Genera una experiencia de aprendizaje completa, rigurosa y adaptada a la profundidad de las fuentes.'}
Cantidad de fuentes activas: ${sourceCount}

${sourcesTextContext ? `CONTENIDO EXTRAÍDO DE LAS FUENTES:\n${sourcesTextContext}` : ''}

REGLAS DE REPARTO INTELIGENTE DEL MAPA MENTAL (MINDMAP CON INFORMACIÓN REAL):
1. El mapa mental DEBE entregar información sustancial y conocimiento didáctico profundo, no solo etiquetas vacías.
2. Cada rama principal ("subnodos") DEBE incluir:
   - "titulo": Concepto claro y preciso.
   - "categoria": Área o dimensión temática.
   - "descripcion": Explicación y síntesis didáctica completa (2 a 4 oraciones) que explique a fondo el concepto, cómo opera, su relevancia y sus puntos críticos derivados de las fuentes.
   - "detalles": Array con sub-conceptos, reglas, fórmulas, distinciones o procesos explicados con claridad.
3. La IA decide autónomamente cuántas ramas principales ("subnodos") necesita el tema según la densidad real de información (típicamente entre 4 y 8 ramas principales).
4. PARA CADA RAMA PRINCIPAL, LA IA DECIDE SI DEBE TENER SUB-RAMAS ("detalles"), CUÁNTAS Y SI SÍ O NO:
   - Si una rama es un concepto directo, puntual o atómico: puede tener 0 sub-ramas ("detalles": []) o 1 punto conciso.
   - Si una rama abarca un pilar amplio, fórmulas, clasificaciones o reglas operativas: la IA le asigna de 2 a 5 sub-ramas en "detalles" que aporten conocimiento real y explicativo.
5. El título "nodoPrincipal" del mindmap debe ser el nombre temático real del contenido.

ESCALA DINÁMICA DE CONTENIDO SEGÚN LA CANTIDAD Y RIQUEZA DE FUENTES:
${
  sourceCount >= 2
    ? `- Fuentes activas múltiples (${sourceCount}): Cruza activamente los conceptos entre las diferentes fuentes.
  * Cuestionario (quiz): Entre 10 y 18 preguntas desafiantes y contextualizadas con explicaciones profundas.
  * Flashcards: Entre 14 y 24 fichas didácticas que abarquen todos los ángulos de las fuentes integradas.`
    : `- Fuente base única (o tema puntual): Estructura equilibrada, precisa y clara sin sobrecargar.
  * Cuestionario (quiz): De 5 a 8 preguntas esenciales.
  * Flashcards: De 8 a 14 fichas de estudio claras.`
}

REGLAS DE ESTRUCTURA Y CALIDAD:
1. Cuestionario (quiz): Cada pregunta debe tener 4 opciones ("opciones"), el índice numérico de la opción correcta (0, 1, 2 o 3) en "correcta", y una "explicacion" didáctica convincente.
2. Flashcards:
   - "concepto": Pregunta estimulante y directa para el estudiante (ejemplo: "¿Cómo influye el gradiente de concentración en...?").
   - "definicion": Explicación didáctica completa que responde a la pregunta cuando el usuario toca la tarjeta.
   - "subtitulo": Categoría o etiqueta conceptual breve.
   - "ejemplo": Caso práctico o analogía breve.
3. Todo el contenido debe ser riguroso, en español impecable, sin inventar hechos que contradigan las fuentes.

Debes devolver EXCLUSIVAMENTE un esquema JSON válido.
`;

    parts.push({ text: promptInstruction });

    const schemaConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pregunta: { type: Type.STRING },
                opciones: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correcta: { type: Type.INTEGER },
                explicacion: { type: Type.STRING },
              },
              required: ['pregunta', 'opciones', 'correcta', 'explicacion'],
            },
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                concepto: { type: Type.STRING },
                subtitulo: { type: Type.STRING },
                formula: { type: Type.STRING },
                definicion: { type: Type.STRING },
                ejemplo: { type: Type.STRING },
              },
              required: ['concepto', 'definicion'],
            },
          },
          mindmap: {
            type: Type.OBJECT,
            properties: {
              nodoPrincipal: { type: Type.STRING },
              subnodos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titulo: { type: Type.STRING },
                    categoria: { type: Type.STRING },
                    descripcion: { type: Type.STRING },
                    detalles: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    videoMin: { type: Type.STRING },
                    quizzesCount: { type: Type.INTEGER },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['titulo', 'detalles'],
                },
              },
            },
            required: ['nodoPrincipal', 'subnodos'],
          },
        },
        required: ['quiz', 'flashcards', 'mindmap'],
      },
    };

    let response: any = null;
    let successfulModel = '';
    let lastError: any = null;
    let isQuotaError = false;

    // Cascade through models
    for (const modelCandidate of CASCADE_MODELS) {
      try {
        console.log(`[Gemini Cascade] Probando modelo: ${modelCandidate}...`);
        response = await ai.models.generateContent({
          model: modelCandidate,
          contents: { parts },
          config: schemaConfig,
        });

        if (response && response.text) {
          successfulModel = modelCandidate;
          console.log(`[Gemini Cascade] Éxito con modelo: ${modelCandidate}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();
        const errStatus = err?.status || err?.statusCode || 0;
        const isSaturated =
          errStatus === 429 ||
          errStatus === 503 ||
          errMsg.includes('429') ||
          errMsg.includes('503') ||
          errMsg.includes('resourceexhausted') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('quota') ||
          errMsg.includes('overloaded') ||
          errMsg.includes('high demand') ||
          errMsg.includes('capacity');

        if (isSaturated) {
          console.warn(`[Gemini Cascade] Modelo ${modelCandidate} saturado/sin cuota. Probando siguiente modelo...`);
          isQuotaError = true;
          continue;
        } else {
          // If error is authentication or bad request, don't cascade fruitlessly
          console.error(`[Gemini Error] Fallo en ${modelCandidate}:`, errMsg);
          if (errMsg.includes('api key') || errMsg.includes('unauthorized') || errMsg.includes('forbidden')) {
            return res.status(401).json({
              success: false,
              quotaExhausted: true,
              message: 'La clave de API de Gemini proporcionada es inválida o expiró. Por favor introduce una clave válida.',
            });
          }
          isQuotaError = true;
          continue;
        }
      }
    }

    if (!response || !response.text) {
      if (isQuotaError) {
        return res.status(429).json({
          success: false,
          quotaExhausted: true,
          message: 'Todos los modelos del sistema están temporalmente saturados. Introduce tu propia API Key de Google Gemini para continuar sin límites.',
          modelsTried: CASCADE_MODELS,
        });
      }
      throw lastError || new Error('No se pudo generar con ninguno de los modelos.');
    }

    const rawText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const cleaned = rawText.replace(/```(?:json)?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const uniqueId = `exp-${Math.random().toString(36).substring(2, 9)}`;

    const experience = {
      id: uniqueId,
      tema: parsed.mindmap?.nodoPrincipal || effectiveTopic,
      subtitulo: 'Síntesis Pedagógica Generada con Gemini',
      autor: '@AprendeAI',
      version: 'Aprende AI v3.0',
      createdAt: new Date().toISOString(),
      fuentes: inputSourcesList.map((s, idx) => ({
        id: s.id || `src-${idx}`,
        nombre: s.nombre || 'Fuente analizada',
        tamano: s.tamano || 'Procesada',
        estado: 'Analizado',
        tipo: s.tipo || 'texto',
        url: s.url,
      })),
      stats: {
        quizViews: 0,
        cardViews: 0,
        mapViews: 0,
      },
      quiz: parsed.quiz || [],
      flashcards: parsed.flashcards || [],
      mindmap: parsed.mindmap || { nodoPrincipal: effectiveTopic, subnodos: [] },
    };

    experiencesStore.set(uniqueId, experience);

    res.json({ success: true, experience, id: uniqueId });
  } catch (error: any) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar con Gemini: ' + (error?.message || 'Error desconocido'),
    });
  }
});

// Interactive Chat with Sources (NotebookLM style)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, sources, topic, userApiKey } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Mensaje requerido' });
    }

    const customApiKey = (req.headers['x-gemini-api-key'] as string) || userApiKey;
    const effectiveApiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;

    if (!effectiveApiKey) {
      return res.status(429).json({
        success: false,
        quotaExhausted: true,
        message: 'Clave de Gemini API requerida para chatear con el asistente.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [];

    // Collect sources text and images
    const inputSourcesList: any[] = Array.isArray(sources) ? sources : [];
    let sourcesContext = '';
    const citedSourceNames: string[] = [];

    for (const src of inputSourcesList) {
      if (src.nombre) citedSourceNames.push(src.nombre);
      if (src.base64 && src.mimeType) {
        parts.push({
          inlineData: {
            mimeType: src.mimeType,
            data: src.base64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }
      if (src.extractedText) {
        sourcesContext += `\n\n--- DOCUMENTO/FUENTE: "${src.nombre}" (${src.tipo}) ---\n${src.extractedText.slice(0, 15000)}`;
      } else if (src.url) {
        sourcesContext += `\n\n--- ENLACE FUENTE: "${src.nombre}" ---\nURL: ${src.url}`;
      }
    }

    const systemInstruction = `
Actúa como un tutor pedagógico interactivo de alto nivel ("Aprende AI Tutor"), con el rigor analítico de Google NotebookLM.
Tu objetivo principal es responder a las preguntas, dudas y solicitudes del usuario BASÁNDOTE PRINCIPALMENTE EN LAS FUENTES ADJUNTAS proporcionadas a continuación.

TEMA DEL ENTORNO: ${topic || 'Estudio y Análisis Conceptual'}

${sourcesContext ? `FUENTES ACTIVAS EN ESTE ENTORNO:\n${sourcesContext}` : 'NOTA: No hay fuentes de texto adjuntas todavía. Si el usuario hace preguntas sobre sus fuentes, indícale amablemente que puede subir archivos PDF, notas de texto, enlaces web o fotos en el panel de Fuentes de este entorno.'}

NORMAS DE INTERACCIÓN:
1. Responde de forma clara, amena, estructurada y pedagógica.
2. Si la información proviene de una fuente específica, cita o menciona la fuente (por ejemplo: "De acuerdo con tus apuntes...", "Según el PDF adjunto...").
3. Si el usuario te hace preguntas conceptuales que van más allá del texto de las fuentes, puedes responder usando tu base de conocimiento pedagógico, pero aclarando amablemente que ese dato complementa las fuentes cargadas.
4. Si el usuario te pide crear o generar un cuestionario, flashcards o mapa mental, explícale que puede presionar el botón "⚡ Generar Material de Estudio" situado arriba en la sección de Fuentes o dentro del entorno, y ofrécele un adelanto con 2 o 3 conceptos destacados.
5. Utiliza formato Markdown limpio (listas con viñetas, negritas para términos clave, código si aplica).
6. REGLAS CRUCIALES DE FÓRMULAS MATEMÁTICAS Y ESPACIADO:
   - Cuando expliques matemáticas, identidades trigonométricas, física o fórmulas:
     * Deja SIEMPRE un renglón en blanco antes y después de cada fórmula.
     * Para fórmulas importantes, usa modo display en bloque centrado con doble dólar:
       $$ \frac{\text{Cateto Opuesto}}{\text{Hipotenusa}} = \frac{CO}{H} $$
     * En listas numeradas de identidades o ecuaciones, deja un renglón en blanco entre cada número para que las fracciones respiren con generoso espacio y nunca choquen.
     * En palabras dentro de fracciones, utiliza siempre \\text{...} (ej. \\frac{\\text{Cateto Adyacente}}{\\text{Hipotenusa}}).
`;

    // History formatting
    let conversationContext = '';
    if (Array.isArray(history) && history.length > 0) {
      conversationContext = history
        .slice(-6)
        .map((h: any) => `${h.role === 'user' ? 'Usuario' : 'Aprende AI'}: ${h.content}`)
        .join('\n\n');
    }

    const fullPrompt = `${systemInstruction}

${conversationContext ? `HISTORIAL PREVIO DE LA CHARLA:\n${conversationContext}\n\n` : ''}
PREGUNTA O PETICIÓN DEL USUARIO:
${message}
`;

    parts.push({ text: fullPrompt });

    // Execute with fallback cascade
    let responseText = '';
    let isQuotaError = false;
    let lastError: any = null;

    for (const modelCandidate of CASCADE_MODELS) {
      try {
        const result = await ai.models.generateContent({
          model: modelCandidate,
          contents: parts,
        });

        if (result && result.text) {
          responseText = result.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || '').toLowerCase();
        if (errMsg.includes('quota') || errMsg.includes('rate') || errMsg.includes('429')) {
          isQuotaError = true;
        }
        continue;
      }
    }

    if (!responseText) {
      if (isQuotaError) {
        return res.status(429).json({
          success: false,
          quotaExhausted: true,
          message: 'Límite de cuota alcanzado en los modelos. Por favor ingresa tu API Key personal de Google Gemini para continuar chateando.',
        });
      }
      throw lastError || new Error('No se pudo obtener respuesta del modelo.');
    }

    res.json({
      success: true,
      reply: responseText,
      sourcesCited: citedSourceNames,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Error en el chat con IA',
    });
  }
});

// Setup Vite in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
