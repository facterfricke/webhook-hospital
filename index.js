const express = require("express");
const app = express();

app.use(express.json());

// Definir equipos críticos y no críticos
const equiposCriticos = [
  "soporte vital", "emergencias", "energía", "transporte de pacientes", "helipuerto"
];

const equiposNoCriticos = [
  "impresora", "pc administrativo", "cápsula de correo neumático", "monitor", "tv"
];

// Función para clasificar
function clasificarProblema(equipo, problema) {
  const equipoLower = equipo.toLowerCase();
  const problemaLower = problema.toLowerCase();

  // Si el equipo es crítico o el problema indica falla grave
  if (equiposCriticos.some(e => equipoLower.includes(e)) ||
      problemaLower.includes("dejó de funcionar") ||
      problemaLower.includes("no funciona")) {
    return "urgencia";
  }

  // En cualquier otro caso
  return "orden de trabajo";
}

app.post("/webhook", (req, res) => {
  const params = req.body.queryResult.parameters;
  const equipo = params.equipo || "";
  const problema = params.problema || "";

  const clasificacion = clasificarProblema(equipo, problema);

  let mensaje = "";
  if (clasificacion === "urgencia") {
    mensaje = "Dado que este problema requiere atención inmediata, un ejecutivo se pondrá en contacto contigo en breve.";
  } else {
    mensaje = "Dado que este problema no requiere atención inmediata, se generará una orden de trabajo y será enviada al equipo correspondiente.";
  }

  console.log("Equipo:", equipo, "| Problema:", problema, "| Clasificación:", clasificacion);

  res.json({
    fulfillmentText: mensaje
  });
});

app.listen(3000, () => {
  console.log("Webhook corriendo en puerto 3000");
});
