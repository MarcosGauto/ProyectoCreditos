export async function calculateQualification(cuit, token) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/qualification/${cuit}/calculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  })

  if (!res.ok) throw new Error("Error al calcular la calificación")

  return res.json()
}

export async function getQualification(cuit, token) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/qualification/${cuit}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) throw new Error("Error al obtener calificación")

  return res.json()
}
