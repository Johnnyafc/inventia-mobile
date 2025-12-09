import { GoogleGenerativeAI } from "@google/generative-ai";

// TU CLAVE REAL (Cópiala tal cual)
const API_KEY = "AIzaSyC-R9Ca2js0xxHWq-mW8sB7eLI93lJsWZg";

const genAI = new GoogleGenerativeAI(API_KEY);

export const procesarTextoConIA = async (textoHablado) => {
  try {
    // Usamos el modelo flash que es más rápido y barato
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Eres un asistente de inventario para una tienda en Ecuador. 
      Analiza este texto hablado: "${textoHablado}".
      
      Tu tarea es extraer los datos y devolver UNICAMENTE un objeto JSON.
      
      Estructura JSON requerida:
      {
        "nombre": "Nombre del producto (ej: Atún Real, Cola Big)",
        "marca": "Marca del producto (si se menciona)",
        "precio": "Precio unitario en formato numérico string (ej: '1.50')",
        "stock": "Cantidad o stock en formato numérico string (ej: '10')",
        "categoria": "Categoría sugerida (ej: Bebidas, Abarrotes, Limpieza)"
      }

      Reglas:
      1. Si el usuario dice "dólares" o "con", conviértelo a punto decimal (ej: "1 con 50" -> "1.50").
      2. Si falta algún dato, déjalo como cadena vacía "".
      3. No respondas con nada más que el JSON. Sin bloques de código markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpieza de seguridad por si la IA devuelve formato markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);

  } catch (error) {
    console.error("Error interpretando con IA:", error);
    return null;
  }
};