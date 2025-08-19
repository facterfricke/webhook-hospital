const express = require("express");
const fetch = require("node-fetch"); // Asegúrate de tenerlo instalado: npm install node-fetch@2
const app = express();

app.use(express.json());

// Tu API Key de Gemini
const GEMINI_API_KEY = "AIzaSyDegkvmaPwNz69bluDDeMNT1IXhhnTXIx0";

// Función que llama a Gemini
async function classifyWithGemini(prompt) {
  const url = "https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash:generateText";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: { text: prompt },
      temperature: 0,
      maxOutputTokens: 200
    }),
  });

  const data = await response.json();
  return data.candidates && data.candidates[0] ? data.candidates[0].content : null;
}

app.post("/webhook", async (req, res) => {
  try {
    const params = req.body.queryResult.parameters;

    // Construimos prompt para Gemini usando tu texto
    const geminiPrompt = `
${params.nombre ? "Nombre: " + params.nombre : ""}
${params.correo ? "Correo: " + params.correo : ""}
${params.servicio ? "Servicio: " + params.servicio : ""}
${params.equipo ? "Equipo: " + params.equipo : ""}
${params.problema ? "Problema: " + params.problema : ""}

${`Como asistente virtual especializado en la creación de un chatbot para uso hospitalario, tu objetivo es clasificar el problema como "urgencia" o "orden de trabajo" siguiendo estas reglas:

- Clasifica como "urgencia" si el equipo está vinculado a funciones críticas y el problema implica interrupción grave.
- Clasifica como "orden de trabajo" si el equipo es de apoyo no vital o si el problema no compromete atención inmediata.
- Solo urgencia si compromete directamente la seguridad de las personas o la vida de un paciente.
- Devuelve únicamente la categoría: "urgencia" o "orden de trabajo".
- **Importante**: no clasifiques como urgencia únicamente por estar en un área crítica. Evalúa siempre el equipo afectado y la naturaleza del problema. Será urgencia solo si compromete directamente la seguridad de las personas, la vida de un paciente o el funcionamiento esencial de la unidad.`}
`;

    const classification = await classifyWithGemini(geminiPrompt);

    let fulfillmentText = "";

    if (classification.toLowerCase().includes("urgencia")) {
      fulfillmentText = "Dado que este problema requiere atención inmediata, un ejecutivo se pondrá en contacto contigo en breve.";
    } else {
      fulfillmentText = "Dado que este problema no requiere atención inmediata, se generará una orden de trabajo y será enviada al equipo correspondiente.";
    }

    res.json({
      fulfillmentText,
      outputContexts: [
        {
          name: `${req.body.session}/contexts/classification`,
          lifespanCount: 1,
          parameters: { classification }
        }
      ]
    });

  } catch (error) {
    console.error(error);
    res.json({ fulfillmentText: "Ocurrió un error al procesar la solicitud." });
  }
});

app.listen(3000, () => {
  console.log("Webhook corriendo en puerto 3000 con Gemini Flash 🚑");
});
