import { JuridicaForm } from "@/components/Juridica-form"

export default function JuridicaPage({ params }) {
  return (
    <main className="min-h-screen p-6 bg-gray-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Análisis Persona Jurídica</h1>
          <p className="text-muted-foreground">CUIT: {params.cuit}</p>
        </div>
        <JuridicaForm cuit={params.cuit} />
      </div>
    </main>
  )
}
