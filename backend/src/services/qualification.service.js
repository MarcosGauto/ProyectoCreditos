import { db } from "../firebase.js"

export async function buildQualification(cuit) {
  // ===============================
  // 1. Obtener datos del backend
  // ===============================
  const [client, balances, cheques, iva, iibb, bcra] = await Promise.all([
    getDoc("clients", cuit),
    getCollection(`balances/${cuit}/items`),
    getCollection(`cheques/${cuit}/items`),
    getDoc("iva", cuit),
    getDoc("iibb", cuit),
    getDoc("bcra", cuit),
  ])

  if (!client) throw new Error("El cliente no existe")

  // ===============================
  // 2. RATIOS FINANCIEROS
  // ===============================
  const lastBalance = balances.sort((a, b) => b.periodo - a.periodo)[0]

  const liquidez = lastBalance
    ? lastBalance.activo_corriente / lastBalance.pasivo_corriente
    : null

  const endeudamiento = lastBalance
    ? lastBalance.pasivo_total / lastBalance.patrimonio
    : null

  const margen = lastBalance
    ? lastBalance.resultado_neto / lastBalance.ventas
    : null

  // ===============================
  // 3. Cheques rechazados
  // ===============================
  const totalCheques = cheques.length
  const rechazados = cheques.filter(c => c.estado === "RECHAZADO").length
  const rechazosPct = totalCheques > 0 ? rechazados / totalCheques : 0

  // ===============================
  // 4. Cumplimiento fiscal
  // ===============================
  const mesesIVA = iva?.declaraciones?.length || 0
  const mesesIIBB = iibb?.declaraciones?.length || 0

  const fiscalScore =
    (mesesIVA >= 6 ? 1 : mesesIVA >= 3 ? 0.5 : 0) +
    (mesesIIBB >= 6 ? 1 : mesesIIBB >= 3 ? 0.5 : 0)

  // ===============================
  // 5. BCRA
  // ===============================
  const situaciónCrediticia = bcra?.situacion_general ?? 0
  const bcraScore = situaciónCrediticia === 1 ? 1 : situaciónCrediticia === 2 ? 0.5 : 0

  // ===============================
  // 6. Score Final
  // ===============================
  let score = 0

  // Ratios
  if (liquidez !== null) score += liquidez >= 1.2 ? 25 : liquidez >= 1 ? 10 : 0
  if (endeudamiento !== null) score += endeudamiento <= 1 ? 25 : endeudamiento <= 2 ? 10 : 0
  if (margen !== null) score += margen >= 0.05 ? 15 : margen >= 0 ? 5 : 0

  // Cheques
  score += rechazosPct === 0 ? 15 : rechazosPct < 0.05 ? 5 : 0

  // Fiscal
  score += fiscalScore === 2 ? 10 : fiscalScore === 1 ? 5 : 0

  // BCRA
  score += bcraScore === 1 ? 10 : bcraScore === 0.5 ? 5 : 0

  // ===============================
  // 7. Categoría final
  // ===============================
  let categoria = "D"
  if (score >= 80) categoria = "A"
  else if (score >= 60) categoria = "B"
  else if (score >= 40) categoria = "C"

  // ===============================
  // 8. Guardar resultado
  // ===============================
  const result = {
    cuit,
    score,
    categoria,
    liquidez,
    endeudamiento,
    margen,
    rechazosPct,
    fiscalScore,
    bcraScore,
    timestamp: Date.now()
  }

  await db.collection("qualification").doc(cuit).set(result)

  return result
}

// =========================
// Helpers Firebase
// =========================
async function getDoc(collection, id) {
  const snap = await db.collection(collection).doc(id).get()
  return snap.exists ? snap.data() : null
}

async function getCollection(path) {
  const snap = await db.collection(path).get()
  return snap.docs.map(d => d.data())
}
