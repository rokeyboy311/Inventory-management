import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Division Location Inventory System API',
    database: 'Supabase Master Cloud'
  });
});

// AI Performa Photo Scanner Endpoint (Gemini Vision OCR -> 23-Item Structured JSON)
app.post('/api/ai/scan-performa', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'Image base64 data is required' });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server.'
      });
    }

    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const resolvedMimeType =
      mimeType && typeof mimeType === 'string' && mimeType.startsWith('image/')
        ? mimeType
        : 'image/jpeg';

    const promptText = `You are an expert OCR and electrical engineering data extractor for DGVCL / PGVCL / UGVCL / MGVCL "Work Report of Transformer Maintenance Work" Performa sheets (such as SHIV ELECTRICALS / RUDRA ELECTRICALS / ANKLESHWAR IND DIVISION).

Carefully inspect the uploaded photo of the handwritten or printed Performa sheet and extract all filled data into JSON:

1. Header fields (top section of the sheet):
   - location: "Location of Transformer" (preserve exact English or Gujarati text, plot numbers, company names, or feeder codes like "D1S2-66-B-2", "JAY GANESH PLOT NO:-5733", "પ્લોટ નં. 492/4").
   - date: "Date" converted to YYYY-MM-DD format (for example, if written as "18-09-2026", "18/9/26", or "18-8-26", convert 2-digit year 26 to 2026 -> "2026-09-18" or "2026-08-18").
   - transformerMake: "Transformer Make" (e.g., "Aman", "Voltamp", "ABB", "Crompton", "Bharat Bijlee", "Kotsons", "Jayesh", etc.).
   - transformerSerialNo: "Transformer Serial Number" (e.g., "743", "52", "TR-99201").
   - capacity: "Capacity" in KVA (strip "KVA" suffix; keep values like "10", "16", "25", "63", "63/22", "100", "200", "315", "500").

2. Measurements (Rows 19 & 20 near the bottom of the table):
   - Row 19 Voltage: extract numbers written next to R-N (voltageRN), Y-N (voltageYN), B-N (voltageBN), e.g. "234", "235", "232".
   - Row 20 Ampere: extract numbers written next to R (ampereR), Y (ampereY), B (ampereB), N (ampereN), e.g. "99", "72", "85", "42".

3. Maintenance Rows (rowIndex 0 to 22 corresponding to the 23 consolidated master items):
   0: [SR 1] Replacement of LT bushing Goti/Rubber Washer (Nos.)
   1: [SR 1.1] Replacement of HT bushing Goti/Rubber Washer (Nos.)
   2: [SR 2] Providing of half stud on LT side (Nos.)
   3: [SR 2.1] Providing of AL. Patta on LT side (Nos.)
   4: [SR 3] Check and Tight earth Connection (Nos.)
   5: [SR 4] Replacement of damage LT cable with new one of right capacity -> sizeKey options: "Nos.", "C-1(70)", "C-2(150)"
   6: [SR 5] Providing of termination in form of RYB And N core including PVC tape (LS)
   7: [SR 6] Termination of 25/50/70 Sq mm cable -> sizeKey options: "25", "50", "70"
   8: [SR 6.1] Termination of 95/120/150 Sq mm cable -> sizeKey options: "95", "120", "150"
   9: [SR 6.2] Termination of 185 Sq mm cable -> sizeKey option: "185"
   10: [SR 7] Check Oil leakage and Top up of Oil (oil provide by DGVCL) (Nos.)
   11: [SR 8] Measurement of Voltage and Ampere (Nos.)
   12: [SR 9] Fixing new box with complete wiring (Nos.)
   13: [SR 9.1] Replacement of new box up to / above 100 Amp -> sizeKey options: "Up to 100 Amp", "Above 100 Amp"
   14: [SR 10] Checking and Replacement of Kit-Kat fuse (100Amp / 200Amp) -> sizeKey options: "100Amp", "200Amp"
   15: [SR 11] 630 / 400 / 250 amp HRC fuse base -> sizeKey options: "630 amp", "400 amp", "250 amp"
   16: [SR 12] 630 / 400 / 250 amp HRC fuse Link -> sizeKey options: "630 amp", "400 amp", "250 amp"
   17: [SR 13] Providing of Fuse element on HT side (on D.O fuse) (Nos.)
   18: [SR 14] Providing and replacement of sundry items like nut, bolt, washer etc. (LS)
   19: [SR 15] General Condition Cleaning, Clamping and Proforma Forment (JOB)
   20: [SR 16] LT side Brass Nut 12MM / 20MM / 30MM -> sizeKey options: "12MM", "20MM", "30MM"
   21: [SR 17] LT side Brass washer 12MM / 20MM / 30MM -> sizeKey options: "12MM", "20MM", "30MM"
   22: [SR 18] Breather (Nos.)

IMPORTANT OCR RULES FOR HANDWRITTEN ROWS:
- Look closely at each row's "Material (Yes/No)", "Labour (Yes/No)", and "QTY" columns.
- Handwritten checkmarks (✓, ✔), "Yes", "Y", or ditto marks in the "Yes" column mean true. Marks in "No" or dashes (-) mean false.
- For rows with sizeKey options (rowIndex 5, 7, 8, 9, 13, 14, 15, 16, 20, 21), include sizeKey matching the specific size (if multiple sizes are used on the same row, emit multiple objects in activeRows with the same rowIndex and their respective sizeKey and qty).
- If a row has a non-zero handwritten QTY (e.g. "1", "2", "3", "4", "6", "8", "6m"), set materialYes: true, labourYes: true, and qty to that string.
- Return all active rows where materialYes is true, labourYes is true, or qty is non-empty.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING },
        date: { type: Type.STRING },
        transformerMake: { type: Type.STRING },
        transformerSerialNo: { type: Type.STRING },
        capacity: { type: Type.STRING },
        measurements: {
          type: Type.OBJECT,
          properties: {
            voltageRN: { type: Type.STRING },
            voltageYN: { type: Type.STRING },
            voltageBN: { type: Type.STRING },
            ampereR: { type: Type.STRING },
            ampereY: { type: Type.STRING },
            ampereB: { type: Type.STRING },
            ampereN: { type: Type.STRING }
          }
        },
        activeRows: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              rowIndex: { type: Type.INTEGER },
              sizeKey: { type: Type.STRING },
              materialYes: { type: Type.BOOLEAN },
              labourYes: { type: Type.BOOLEAN },
              qty: { type: Type.STRING }
            },
            required: ['rowIndex', 'materialYes', 'labourYes', 'qty']
          }
        }
      }
    };

    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash'];
    let lastError: unknown = null;
    let rawText = '';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: resolvedMimeType,
                data: cleanBase64
              }
            },
            { text: promptText }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema
          }
        });
        rawText = response.text || '';
        if (rawText) break;
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(`[AI Scan] Model ${modelName} failed, trying fallback if available:`, modelErr);
      }
    }

    if (!rawText) {
      throw lastError || new Error('Empty response from Gemini Vision API');
    }

    const cleanedJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: unknown) {
    console.error('[AI Scan Error]:', err);
    const msg = err instanceof Error ? err.message : 'Failed to scan performa image';
    return res.status(500).json({ success: false, error: msg });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[Server] App running on port ${PORT} (Single Master DB: Supabase)`);
  });
}

startServer();
