"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm, Controller } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileUpload } from "@/components/file-upload"
import { cn } from "@/lib/utils"

import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

// ----------------- SCHEMA -----------------
const formSchema = z.object({
    razonSocial: z.string().optional(),
    ingresos: z.string().optional(),
    iva: z.array(
        z.object({
            fecha: z.date({ required_error: "Seleccione una fecha" }),
            debitoFiscal: z.string().min(1, "Campo requerido"),
            creditoFiscal: z.string().min(1, "Campo requerido"),
        })
    ).min(1, "Debe ingresar al menos una declaración de IVA"),
    iibb: z.array(
        z.object({
            fecha: z.date({ required_error: "Seleccione una fecha" }),
            impuestoDeterminado: z.string().min(1, "Campo requerido"),
            alicuota: z.string().optional(),
            baseImponible: z.string().min(1, "Campo requerido"),
        })
    ).min(1, "Debe ingresar al menos una declaración de IIBB"),
    balances: z.array(
        z.object({
            fecha: z.date({ required_error: "Seleccione una fecha" }),
            activoCorriente: z.string().optional(),
            activoNoCorriente: z.string().optional(),
            totalActivo: z.string().optional(),
            disponibilidades: z.string().optional(),
            creditosVentas: z.string().optional(),
            inventarios: z.string().optional(),
            cuentasSocios: z.string().optional(),
            pasivoCorriente: z.string().optional(),
            pasivoNoCorriente: z.string().optional(),
            totalPasivo: z.string().optional(),
            deudasComerciales: z.string().optional(),
            patrimonioNeto: z.string().optional(),
            capitalSuscripto: z.string().optional(),
        })
    ).optional(),
})

export function JuridicaForm({ cuit }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            razonSocial: "",
            ingresos: "",
            iva: [{ fecha: new Date(), debitoFiscal: "", creditoFiscal: "" }],
            iibb: [{ fecha: new Date(), impuestoDeterminado: "", alicuota: "", baseImponible: "" }],
            balances: [{
                fecha: new Date(),
                activoCorriente: "", activoNoCorriente: "", totalActivo: "",
                disponibilidades: "", creditosVentas: "", inventarios: "", cuentasSocios: "",
                pasivoCorriente: "", pasivoNoCorriente: "", totalPasivo: "", deudasComerciales: "",
                patrimonioNeto: "", capitalSuscripto: ""
            }],
        },
    })

    const { control, handleSubmit, setValue } = form
    const { fields: ivaFields, append: appendIva, remove: removeIva } = useFieldArray({ control, name: "iva" })
    const { fields: iibbFields, append: appendIibb, remove: removeIibb } = useFieldArray({ control, name: "iibb" })
    const { fields: balanceFields, append: appendBalance, remove: removeBalance } = useFieldArray({ control, name: "balances" })

    // ----------------- PDF UPLOAD -----------------
    async function handlePdfUpload(file) {
        if (!file) return
        try {
            const pdfjsLib = await import("pdfjs-dist/webpack")
            const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                (pdfjsWorker?.default?.toString?.()) ||
                (typeof pdfjsWorker === "string" ? pdfjsWorker : pdfjsWorker.toString())

            const arrayBuffer = await file.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

            let fullText = ""
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum)
                const textContent = await page.getTextContent()
                fullText += textContent.items.map((item) => item.str).join(" ") + "\n"
            }

            console.log("📑 Texto extraído:", fullText.slice(0, 500))

            // ----------------- 🔹 Detectar Balance -----------------
            if (/Activo Corriente|Pasivo Corriente|Patrimonio Neto/i.test(fullText)) {
                const getValue = (label) =>
                    fullText.match(new RegExp(label + "\\s+\\$?\\s*([\\d.,]+)", "i"))?.[1] || ""

                appendBalance({
                    fecha: new Date(),
                    activoCorriente: getValue("Activo Corriente"),
                    activoNoCorriente: getValue("Activo No Corriente"),
                    totalActivo: getValue("Total Activo"),
                    disponibilidades: getValue("Disponibilidades"),
                    creditosVentas: getValue("Cr[eé]ditos por Ventas"),
                    inventarios: getValue("Inventarios"),
                    cuentasSocios: getValue("Cuentas Particulares Socios"),
                    pasivoCorriente: getValue("Pasivo Corriente"),
                    pasivoNoCorriente: getValue("Pasivo No Corriente"),
                    totalPasivo: getValue("Total Pasivo"),
                    deudasComerciales: getValue("Deudas Comerciales"),
                    patrimonioNeto: getValue("Patrimonio Neto"),
                    capitalSuscripto: getValue("Capital Suscripto"),
                })
            }
        } catch (err) {
            console.error("❌ Error leyendo PDF en cliente:", err)
        }
    }

    // ----------------- SUBMIT -----------------
    async function onSubmit(values) {
        setLoading(true)
        try {
            await fetch(`/api/declarations/${cuit}/pdf`, {
                method: "POST",
                body: JSON.stringify(values),
                headers: { "Content-Type": "application/json" },
            })
            router.push(`/analysis/${cuit}/result`)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* DATOS CONTRIBUYENTE */}
                <Card>
                    <CardHeader><CardTitle>Datos del Contribuyente</CardTitle></CardHeader>
                    <CardContent>
                        <FormField control={control} name="razonSocial" render={({ field }) => (
                            <FormItem><FormControl><Input placeholder="Razón Social" {...field} readOnly /></FormControl></FormItem>
                        )} />
                    </CardContent>
                </Card>

                {/* IVA */}
                {/* ... aquí va tu bloque de IVA (sin cambios) ... */}

                {/* IIBB */}
                {/* ... aquí va tu bloque de IIBB (sin cambios) ... */}

                {/* BALANCES */}
                <Card>
                    <CardHeader>
                        <CardTitle>Balances Contables</CardTitle>
                        <CardDescription>Solo personas jurídicas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Activo Corriente</TableHead>
                                    <TableHead>Pasivo Corriente</TableHead>
                                    <TableHead>Patrimonio Neto</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {balanceFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <FormField control={control} name={`balances.${index}.fecha`} render={() => (
                                                <FormItem className="flex flex-col">
                                                    <Controller
                                                        name={`balances.${index}.fecha`}
                                                        control={control}
                                                        render={({ field: { onChange, value } }) => (
                                                            <DatePicker
                                                                selected={value ? new Date(value) : null}
                                                                onChange={onChange}
                                                                dateFormat="MM/yyyy"
                                                                showMonthYearPicker
                                                                className="border p-2 rounded w-[220px]"
                                                            />
                                                        )}
                                                    />
                                                </FormItem>
                                            )} />
                                        </TableCell>
                                        <TableCell>
                                            <FormField control={control} name={`balances.${index}.activoCorriente`} render={({ field }) => (
                                                <FormItem><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                                            )} />
                                        </TableCell>
                                        <TableCell>
                                            <FormField control={control} name={`balances.${index}.pasivoCorriente`} render={({ field }) => (
                                                <FormItem><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                                            )} />
                                        </TableCell>
                                        <TableCell>
                                            <FormField control={control} name={`balances.${index}.patrimonioNeto`} render={({ field }) => (
                                                <FormItem><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                                            )} />
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" disabled={balanceFields.length === 1} onClick={() => removeBalance(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex flex-col gap-4">
                            <Button type="button" variant="outline" size="sm" onClick={() => appendBalance({
                                fecha: new Date(),
                                activoCorriente: "", activoNoCorriente: "", totalActivo: "",
                                disponibilidades: "", creditosVentas: "", inventarios: "", cuentasSocios: "",
                                pasivoCorriente: "", pasivoNoCorriente: "", totalPasivo: "", deudasComerciales: "",
                                patrimonioNeto: "", capitalSuscripto: ""
                            })}>
                                <Plus className="mr-2 h-4 w-4" /> Agregar Balance
                            </Button>
                            <FileUpload label="Adjuntar Balance PDF" onFileSelect={(file) => handlePdfUpload(file)} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>{loading ? "Procesando..." : "Continuar"}</Button>
                </div>
            </form>
        </Form>
    )
}
