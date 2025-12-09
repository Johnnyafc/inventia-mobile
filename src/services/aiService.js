import { GoogleGenerativeAI } from "@google/generative-ai";

// TU CLAVE DE API (Asegúrate de que sea la correcta)
const API_KEY = "AIzaSyDh3GTw8wLmBQsQfGpALRiS5YtydPUTv8k";

const genAI = new GoogleGenerativeAI(API_KEY);

export const procesarTextoConIA = async (textoHablado) => {
  try {
    // --- CORRECCIÓN AQUÍ: Usamos el alias 'latest' o 'gemini-pro' si este falla ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Eres un asistente de inventario experto. Analiza este texto de voz: "${textoHablado}".
      Extrae los datos y devuelve SOLO un objeto JSON (sin markdown).
      
      Estructura requerida:
      {
        "nombre": "Nombre del producto",
        "marca": "Marca (si se menciona)",
        "precio": "Precio unitario (número en string, ej: '1.50')",
        "stock": "Cantidad (número en string, ej: '10')",
        "categoria": "Categoría sugerida"
      }
      
      Reglas:
      - Si dice "dólares" o "con", usa punto decimal.
      - Si falta un dato, déjalo como string vacío "".
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpieza de seguridad
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    console.log("Respuesta IA:", text); // Para depurar en consola
    return JSON.parse(text);

  } catch (error) {
    console.error("Error IA:", error);
    return null;
  }
};