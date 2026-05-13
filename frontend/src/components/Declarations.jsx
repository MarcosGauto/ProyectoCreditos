"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar, Building2 } from "lucide-react"
import Local from "@/components/image/local.jpg"
import Image from "next/image";


export function Declarations() {
    // Datos de ejemplo - puedes reemplazarlos con datos reales
    const declaraciones = [
        {
            id: "balance",
            titulo: "Balance",
            ultimaFecha: "15 de Marzo, 2024",
            descripcion: "Balance General del ejercicio fiscal",
        },
        {
            id: "iva",
            titulo: "Declaración de IVA",
            ultimaFecha: "28 de Febrero, 2024",
            descripcion: "Declaración mensual del Impuesto al Valor Agregado",
        },
        {
            id: "iibb",
            titulo: "Declaración de IIBB",
            ultimaFecha: "20 de Febrero, 2024",
            descripcion: "Declaración de Ingresos Brutos",
        },
    ]

    return (
        <div className="rounded-lg border bg-card shadow-sm text-black w-1/2 mx-auto">
            <Accordion type="single" collapsible className="w-full">
                {declaraciones.map((declaracion) => (
                    <AccordionItem key={declaracion.id} value={declaracion.id}>
                        <AccordionTrigger className="px-6 py-6 text-left hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span className="font-semibold text-foreground">{declaracion.titulo}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                            <div className="rounded-md bg-muted/50 p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">Última fecha:</span>
                                    <span className="text-sm font-semibold text-foreground">{declaracion.ultimaFecha}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{declaracion.descripcion}</p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                <div className="mt-8 rounded-lg border bg-card shadow-sm">
                    <div className="flex items-center gap-3 border-b px-6 py-4">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <h2 className="font-semibold text-foreground">Foto del Local</h2>
                    </div>
                    <div className="p-6">
                        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                            <Image
                                src={Local}
                                alt="Foto del local comercial"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">Vista del establecimiento comercial</p>
                    </div>
                </div>
            </Accordion>
        </div>


    )
}
