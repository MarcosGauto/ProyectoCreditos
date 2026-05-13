"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

export function PdfGenerator({ cuit }) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/pdf/${cuit}`, {
                method: "GET",
            })

            if (!response.ok) throw new Error("Error generando PDF")

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `analisis-crediticio-${cuit}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleDownload} disabled={loading} className="gap-2">
            <FileDown className="h-4 w-4" />
            {loading ? "Generando PDF..." : "Descargar PDF"}
        </Button>
    )
}

