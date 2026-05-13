"use client"

import { useEffect, useState } from "react"
import { useCreditData } from "@/contexto/resultContext"
import { db, storage } from "@/services/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import jsPDF from "jspdf"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IndicatorsSummary } from "@/components/indicators-summary"
import { QualificationSummary } from "@/components/qualification-summary"
import { Button } from "@/components/ui/button"

export function CreditResultSummary({ cuit }) {
    const { creditData, setCreditData } = useCreditData()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)

            if (creditData[cuit]) {
                setData(creditData[cuit])
                setLoading(false)
                return
            }

            try {
                const resultResponse = await fetch(`/api/result/${cuit}`)
                if (!resultResponse.ok) throw new Error("Error en result API")

                const resultData = await resultResponse.json()

                const formattedData = {
                    indicators: resultData.indicators,
                    qualification: resultData.qualification,
                }

                setData(formattedData)
                setCreditData(prev => ({
                    ...prev,
                    [cuit]: formattedData,
                }))
            } catch (err) {
                console.error("Error fetching data:", err)
                setError(err.message)
                setData(null)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [cuit, creditData, setCreditData])

    async function handleSaveEvaluation() {
        if (!data) return
        setSaving(true)
        try {
            // 1️⃣ Generar PDF
            const doc = new jsPDF()
            doc.setFontSize(18)
            doc.text(`Reporte Crediticio - CUIT ${cuit}`, 20, 20)

            doc.setFontSize(12)
            doc.text("📊 Indicadores:", 20, 40)
            doc.text(`Ventas IVA: ${data.indicators.ventasIVA}`, 20, 50)
            doc.text(`Ventas IIBB: ${data.indicators.ventasIIBB}`, 20, 60)
            doc.text(`Ventas Contables: ${data.indicators.ventasContables}`, 20, 70)
            doc.text(`Promedio: ${data.indicators.promedio}`, 20, 80)
            doc.text(`Patrimonio: ${data.indicators.patrimonio}`, 20, 90)

            doc.text("🏦 Calificación:", 20, 110)
            doc.text(JSON.stringify(data.qualification, null, 2), 20, 120)

            const pdfBlob = doc.output("blob")

            // 2️⃣ Subir PDF a Firebase Storage
            const pdfRef = ref(storage, `results/${cuit}/evaluation-${Date.now()}.pdf`)
            await uploadBytes(pdfRef, pdfBlob)
            const pdfUrl = await getDownloadURL(pdfRef)

            // 3️⃣ Guardar snapshot en Firestore
            const evaluationsRef = collection(db, "results", cuit, "evaluations")

            await addDoc(evaluationsRef, {
                indicators: data.indicators,
                qualification: data.qualification,
                pdfUrl,
                createdAt: serverTimestamp(),
            })

            setSaved(true)
        } catch (err) {
            console.error("Error guardando calificación:", err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSkeleton cuit={cuit} />

    if (error) {
        return (
            <Card>
                <CardContent className="py-10">
                    <p className="text-center text-red-500">Error: {error}</p>
                </CardContent>
            </Card>
        )
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="py-10">
                    <p className="text-center text-muted-foreground">
                        No se encontró información para el CUIT {cuit}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Análisis Final</CardTitle>
                    <CardDescription>
                        Resultado del proceso de evaluación crediticia para CUIT {cuit}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <IndicatorsSummary {...data.indicators} />
                    <QualificationSummary {...data.qualification} />

                    <div className="flex justify-end">
                        <Button
                            onClick={handleSaveEvaluation}
                            disabled={saving || saved}
                        >
                            {saved ? "✅ Calificación guardada" : saving ? "Guardando..." : "Guardar Calificación + PDF"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function LoadingSkeleton({ cuit }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-4 w-[200px]" />
                    <p className="text-muted-foreground">Cargando datos para CUIT {cuit}...</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-[150px]" />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-[100px]" />
                                    <Skeleton className="h-6 w-[120px]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
