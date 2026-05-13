"use client"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/service/firebase"
import { ExistingDataViewer } from "@/components/ExistingDataViewer"
import { Button } from "@/components/ui/button"
import { Declarations } from "@/components/Declarations"
import Link from "next/link"

export default function AnalysisPage({ params }) {
    const { cuit } = use(params)
    const router = useRouter()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!cuit) return
            setLoading(true)

            try {
                // Referencias a Firebase
                const ivaRef = collection(db, "empresas", cuit, "iva")
                const iibbRef = collection(db, "empresas", cuit, "iibb")
                const balancesRef = collection(db, "empresas", cuit, "balances")
                // Agregamos la subcolección de BCRA por si ya fue consultado antes
                const bcraRef = collection(db, "empresas", cuit, "bcra_reports")

                const [ivaSnap, iibbSnap, balancesSnap, bcraSnap] = await Promise.all([
                    getDocs(ivaRef),
                    getDocs(iibbRef),
                    getDocs(balancesRef),
                    getDocs(bcraRef)
                ])

                setData({
                    iva: ivaSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    iibb: iibbSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    balances: balancesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    bcra: bcraSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                })
            } catch (error) {
                console.error("Error cargando datos de Firebase:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [cuit])

    if (!cuit) return <div className="p-10 text-center">Error: CUIT no válido.</div>
    if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Analizando legajo en base de datos...</div>

    // Lógica de "Has Data": Si tiene al menos un documento en alguna subcolección
    const hasData = [data?.iva, data?.iibb, data?.balances].some(arr => arr?.length > 0)

    // Normalizamos la ruta de calificación para evitar errores de mayúsculas/minúsculas
    const creditInfoPath = `/analysis/${cuit}/credit-info`

    return (
        <main className="min-h-screen p-6 bg-slate-50 text-black">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Análisis Crediticio Integral</h1>
                    <div className="inline-block bg-white border px-4 py-1 rounded-full shadow-sm">
                        <p className="text-sm font-medium text-slate-600">CUIT: {cuit}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {hasData ? (
                        <div className="bg-white rounded-xl shadow-sm border p-2">
                            <ExistingDataViewer
                                data={data}
                                cuit={cuit}
                                onExit={() => router.push("/")}
                                onNext={() => router.push(creditInfoPath)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6 text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <div className="space-y-2">
                                <p className="text-xl font-semibold text-slate-800">
                                    Legajo Digital Vacío
                                </p>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    No hemos encontrado declaraciones de IVA o Balances previos para este CUIT en nuestro sistema.
                                </p>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <Button variant="outline" onClick={() => router.push("/")}>
                                    Volver al Inicio
                                </Button>
                                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push(creditInfoPath)}>
                                    Realizar Calificación BCRA
                                </Button>
                            </div>
                            
                            <div className="pt-6 border-t max-w-2xl mx-auto">
                                <Declarations />
                            </div>
                        </div>
                    )}

                    {/* BOTÓN REGRESAR */}
                    <div className="flex justify-center pt-4">
                        <Button
                            asChild
                            variant="ghost"
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <Link href="/">← Volver a la búsqueda</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}