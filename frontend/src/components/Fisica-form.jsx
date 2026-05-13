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
import FileUpload from "@/components/file-upload";
import { cn } from "@/lib/utils"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { useEffect } from "react"
import { useWatch } from "react-hook-form"


// ----------------- SCHEMA -----------------
const formSchema = z.object({
    razonSocial: z.string().optional(),
    cuit: z.string().optional(),
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
            alicuota: z.string().optional(), // 👈 agregado
            baseImponible: z.string().min(1, "Campo requerido"),
        })
    ).min(1, "Debe ingresar al menos una declaración de IIBB"),
})

export function FisicaForm({ cuit, razonSocial }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()


    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            razonSocial: razonSocial || "",
            ingresos: "",
            iva: [{ fecha: new Date(), debitoFiscal: "", creditoFiscal: "" }],
            iibb: [{ fecha: new Date(), impuestoDeterminado: "", alicuota: "", baseImponible: "" }],
            cuit: cuit || "",

        },

    })

    const { control, handleSubmit, setValue } = form
    const { fields: ivaFields, append: appendIva, remove: removeIva } = useFieldArray({ control, name: "iva" })
    const { fields: iibbFields, append: appendIibb, remove: removeIibb } = useFieldArray({ control, name: "iibb" })

    // ----------------- PDF UPLOAD -----------------
    // ----------------- PDF UPLOAD -----------------
    async function handlePdfUpload(file) {
        if (!file) return

        try {
            const pdfjsLib = await import("pdfjs-dist/webpack")
            const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url")

            // Worker fix
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                (pdfjsWorker?.default?.toString?.()) ||
                (typeof pdfjsWorker === "string" ? pdfjsWorker : pdfjsWorker.toString())

            const arrayBuffer = await file.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

            let fullText = ""
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum)
                const textContent = await page.getTextContent()
                const pageText = textContent.items.map((item) => item.str).join(" ")
                fullText += pageText + "\n"
            }

            console.log("📑 Texto extraído:", fullText.slice(0, 500))

            // ----------------- 🔹 Período → Fecha -----------------
            const periodo = fullText.match(/Per[ií]odo[:\s]+(\d{6})/i)?.[1]
            let fecha = new Date()
            if (periodo) {
                const anio = parseInt(periodo.slice(0, 4))
                const mes = parseInt(periodo.slice(4, 6)) - 1
                fecha = new Date(anio, mes, 1)
            }

            // ----------------- 🔹 Razón Social -----------------
            const razonSocial =
                fullText.match(/Raz[oó]n Social[:\s]+(.+?)(?=\s+IMPUESTO|$)/i)?.[1]?.trim() || ""
            if (razonSocial) setValue("razonSocial", razonSocial)

            // ----------------- 🔹 IVA -----------------
            const debito = fullText.match(/Débito Fiscal\s+\$?\s*([\d.,]+)/i)?.[1] || ""
            const credito = fullText.match(/Crédito Fiscal\s+\$?\s*([\d.,]+)/i)?.[1] || ""

            if (debito || credito) {
                appendIva({
                    fecha,
                    debitoFiscal: debito,
                    creditoFiscal: credito,
                })
            }

            // ----------------- 🔹 IIBB -----------------
            let impuestoDet = ""

            // Caso 1: texto directo "Impuesto Determinado $xxxx"
            const matchDirecto = fullText.match(/Impuesto\s+Determinado\s+\$?\s*([\d.,]+)/i)
            if (matchDirecto) {
                impuestoDet = matchDirecto[1]
            }

            // Caso 2: tablas → "Jurisdicción   Anticipo   Impuesto Determinado"
            if (!impuestoDet) {
                // Busca filas con formato "901   $586.500,24   $7.785,07"
                const matchTabla = fullText.match(/\d{3}\s+\$?[\d.,]+\s+\$?([\d.,]+)/)
                if (matchTabla) {
                    impuestoDet = matchTabla[1]
                }
            }

            impuestoDet = impuestoDet ? impuestoDet.replace(/\./g, "").replace(",", ".") : ""

            // Buscar alícuota en formato "3.5%" o "3,5 %"
            const alicuotaMatch = fullText.match(/(\d+[.,]?\d*)\s*%/i)
            const alicuota = alicuotaMatch ? parseFloat(alicuotaMatch[1].replace(",", ".")) : null

            let baseImponible = ""
            if (impuestoDet && alicuota) {
                const impuestoNum = parseFloat(impuestoDet)
                if (!isNaN(impuestoNum) && alicuota > 0) {
                    baseImponible = (impuestoNum / (alicuota / 100)).toFixed(2)
                }
            }

            if (impuestoDet) {
                appendIibb({
                    fecha,
                    impuestoDeterminado: impuestoDet,
                    alicuota: alicuota ? alicuota.toString() + "%" : "",
                    baseImponible,
                })
            }

        } catch (err) {
            console.error("❌ Error leyendo PDF en cliente:", err)
        }
    }

    // 🔹 Observar cambios en los valores de IIBB
    const iibbValues = useWatch({ control, name: "iibb" })

    useEffect(() => {
        if (!iibbValues) return

        iibbValues.forEach((row, index) => {
            const impuesto = parseFloat(
                (row.impuestoDeterminado || "")
                    .toString()
                    .replace(/\./g, "")
                    .replace(",", ".")
            )

            // 👇 ahora la alícuota se guarda como número (string "3.5", no "3.5%")
            const alicuota = parseFloat(row.alicuota?.toString().replace(",", ".")) || 3.5

            if (!isNaN(impuesto) && alicuota > 0) {
                const base = (impuesto / (alicuota / 100)).toFixed(2)

                if (row.baseImponible !== base) {
                    setValue(`iibb.${index}.baseImponible`, base, { shouldValidate: true })
                }
            } else {
                if (row.baseImponible !== "") {
                    setValue(`iibb.${index}.baseImponible`, "", { shouldValidate: true })
                }
            }
        })
    }, [iibbValues, setValue])


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

                {/* RAZON SOCIAL */}
                <Card>
                    <CardHeader>
                        <CardTitle>Datos del Contribuyente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={control}
                            name="razonSocial"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl><Input placeholder="Razón Social" {...field} readOnly /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* IVA */}
                <Card>
                    <CardHeader>
                        <CardTitle>Declaraciones de IVA</CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Débito Fiscal</TableHead>
                                    <TableHead>Crédito Fiscal</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ivaFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <FormField control={control} name={`iva.${index}.fecha`} render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn("w-[240px] pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground")}
                                                                >
                                                                    {field.value
                                                                        ? new Date(field.value).toLocaleDateString("es-AR", {
                                                                            year: "numeric",
                                                                            month: "long",
                                                                        })
                                                                        : "Seleccione una fecha"}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent>
                                                            <DatePicker
                                                                selected={field.value ? new Date(field.value) : null}
                                                                onChange={field.onChange}
                                                                dateFormat="MM/yyyy"
                                                                showMonthYearPicker
                                                                className="border p-2 rounded w-[220px]"
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </TableCell>
                                        <TableCell>
                                            <FormField
                                                control={control}
                                                name={`iva.${index}.debitoFiscal`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="0.00" {...field} readOnly />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                        </TableCell>
                                        <TableCell>
                                            <FormField
                                                control={control}
                                                name={`iva.${index}.creditoFiscal`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="0.00" {...field} readOnly />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" disabled={ivaFields.length === 1} onClick={() => removeIva(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="flex flex-col gap-4">
                            <Button type="button" variant="outline" size="sm"
                                onClick={() => appendIva({ fecha: new Date(), debitoFiscal: "", creditoFiscal: "" })}>
                                <Plus className="mr-2 h-4 w-4" /> Agregar Declaración
                            </Button>

                            <FileUpload
                                label="Adjuntar Declaración PDF"
                                onFileSelect={(file) => handlePdfUpload(file)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* IIBB */}
                {/* IIBB */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ingresos Brutos</CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Impuesto Determinado</TableHead>
                                    <TableHead>Alícuota</TableHead>
                                    <TableHead>Base Imponible</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {iibbFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <FormField
                                                control={control}
                                                name={`iibb.${index}.fecha`}
                                                render={() => (
                                                    <FormItem className="flex flex-col">
                                                        <Controller
                                                            name={`iibb.${index}.fecha`}
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
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <FormField
                                                control={control}
                                                name={`iibb.${index}.impuestoDeterminado`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="0.00" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <FormField
                                                control={control}
                                                name={`iibb.${index}.alicuota`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center gap-2">
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="3.5"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <span>%</span>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>


                                        <TableCell>
                                            <FormField
                                                control={control}
                                                name={`iibb.${index}.baseImponible`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="0.00" {...field} readOnly />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={iibbFields.length === 1}
                                                onClick={() => removeIibb(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="flex flex-col gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    appendIibb({
                                        fecha: new Date(),
                                        impuestoDeterminado: "",
                                        alicuota: "3.5", // 👈 predeterminado editable
                                        baseImponible: "",
                                    })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" /> Agregar Declaración
                            </Button>

                            {/* 👇 Adjuntar PDF de IIBB */}
                            <FileUpload
                                label="Adjuntar Declaración IIBB PDF"
                                onFileSelect={(file) => handlePdfUpload(file)}
                            />
                        </div>
                    </CardContent>
                </Card>


                <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Procesando..." : "Continuar"}
                    </Button>
                </div>

            </form>
        </Form>
    )
}
