import axios from "axios";
import https from "https";
import fs from "fs";
import path from "path";

export async function fetchBCRA(cuit) {
  const certPath = path.join(process.cwd(), "certificates", "bcra_cert.pem");
  
  // 1. Crear el agente usando el certificado que me pasaste
  const agent = new https.Agent({
    ca: fs.readFileSync(certPath),
    rejectUnauthorized: true, // Esto valida que el certificado sea real
  });

  try {
    console.log(`📡 Consultando Deudas para CUIT: ${cuit}`);
    
    const response = await axios.get(
      `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuit}`,
      { 
        httpsAgent: agent,
        timeout: 10000 // 10 segundos para evitar que el front se cuelgue
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error en BCRA Service:", error.message);
    throw error;
  }
}