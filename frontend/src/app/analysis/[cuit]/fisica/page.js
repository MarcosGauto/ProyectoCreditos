"use client"

import React from "react"
import { FisicaForm } from "@/components/fisica-form"

export default function FisicaPage({ params, searchParams }) {

  // ⬇️ Ambos deben desestructurarse con React.use()
  const { razon = "", actividad = "" } = React.use(searchParams)
  const { cuit = "" } = React.use(params)

  return (
    <main className="min-h-screen p-6 bg-gray-200">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Análisis Persona Física</h1>
          <p className="text-muted-foreground">CUIT: {cuit}</p>
        </div>

        <FisicaForm
          cuit={cuit}
          razonSocial={razon}
          actividad={actividad}
        />
      </div>
    </main>
  )
}
