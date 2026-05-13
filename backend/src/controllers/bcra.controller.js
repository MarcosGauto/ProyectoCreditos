import { fetchBCRA, fetchCheques } from "../services/bcra.service.js";

export async function bcraController(req, res) {
  const { cuit } = req.params;
  console.log(`🟢 Procesando consulta integral para CUIT: ${cuit}`);

  try {
    // 1. Validar CUIT antes de disparar peticiones
    if (!cuit || cuit.length !== 11) {
      return res.status(400).json({ ok: false, error: "CUIT inválido" });
    }

    // 2. Ejecutar en paralelo para ganar velocidad
    // Usamos Promise.all para que si el BCRA tarda, no se sumen los tiempos
    console.log("📡 Consultando APIs del BCRA...");
    const [bcraData, chequesData] = await Promise.all([
      fetchBCRA(cuit),
      fetchCheques(cuit)
    ]);

    console.log("✅ Datos obtenidos exitosamente");

    // 3. Respuesta unificada
    return res.json({
      ok: true,
      data: {
        deudas: bcraData,
        cheques: chequesData,
        cuit: cuit,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    // 4. Captura de errores específica
    console.error("❌ Error en bcraController:", err.message);
    
    // Si el error viene de Axios (como vimos antes), podemos ser más específicos
    const statusCode = err.response?.status || 500;
    const errorMessage = err.response?.data?.error || err.message;

    return res.status(statusCode).json({ 
      ok: false, 
      error: "Error al consultar la base de datos del BCRA",
      details: errorMessage 
    });
  }
}