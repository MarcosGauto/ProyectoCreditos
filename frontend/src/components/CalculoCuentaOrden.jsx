"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot
} from "firebase/firestore";
import { db } from "@/service/firebase";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Tabla de comisiones ---
const comisiones = {
    general: {
        sinFactura: [
            { min: 11, max: 15, valor: 0.06 },
            { min: 16, max: 20, valor: 0.07 },
            { min: 21, max: 30, valor: 0.1 },
            { min: 31, max: 40, valor: 0.12 },
            { min: 41, max: 50, valor: 0.13 },
        ],
        inscripto: [
            { min: 11, max: 15, valor: 0.02 },
            { min: 16, max: 20, valor: 0.02 },
            { min: 21, max: 30, valor: 0.03 },
            { min: 31, max: 40, valor: 0.03 },
            { min: 41, max: 50, valor: 0.04 },
        ],
        monotributo: [
            { min: 11, max: 15, valor: 0.04 },
            { min: 16, max: 20, valor: 0.05 },
            { min: 21, max: 30, valor: 0.06 },
            { min: 31, max: 40, valor: 0.08 },
            { min: 41, max: 50, valor: 0.09 },
        ],
    },
    tarjeta: {
        sinFactura: [
            { min: 11, max: 15, valor: 0.09 },
            { min: 16, max: 20, valor: 0.11 },
            { min: 21, max: 30, valor: 0.15 },
            { min: 31, max: 40, valor: 0.18 },
            { min: 41, max: 50, valor: 0.21 },
        ],
        inscripto: [
            { min: 11, max: 15, valor: 0.04 },
            { min: 16, max: 20, valor: 0.04 },
            { min: 21, max: 30, valor: 0.04 },
            { min: 31, max: 40, valor: 0.04 },
            { min: 41, max: 50, valor: 0.05 },
        ],
        monotributo: [
            { min: 11, max: 15, valor: 0.06 },
            { min: 16, max: 20, valor: 0.07 },
            { min: 21, max: 30, valor: 0.08 },
            { min: 31, max: 40, valor: 0.1 },
            { min: 41, max: 50, valor: 0.12 },
        ],
    },
};

function getComision(tipoOperacion, tipoCliente, ganancia) {
    if (!tipoOperacion || !tipoCliente || !ganancia) return 0;
    const tabla = comisiones[tipoOperacion][tipoCliente];
    if (!tabla) return 0;
    const tramo = tabla.find((t) => ganancia >= t.min && ganancia <= t.max);
    return tramo ? tramo.valor : 0;
}

export default function CuentaOrdenCalculator() {
    const [form, setForm] = useState({
        cuit: "",
        cliente: "",
        clienteGN: "",
        factura: "",
        proforma: "",
        percepciones: "",
        ganancia: "",
        tipoCliente: "",
        tipoOperacion: "",
        accion: "", // acreditar o transferir
        banco: "",
        cbu: "",
        titular: "",
    });

    const [historial, setHistorial] = useState([]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ---- Cálculos ----
    const ganancia = parseFloat(form.ganancia || "0");
    const proforma = parseFloat(form.proforma || "0");
    const percepciones = parseFloat(form.percepciones || "0");

    const comisionPorcentaje = getComision(
        form.tipoOperacion,
        form.tipoCliente,
        ganancia
    );

    const importeOperacion = proforma - percepciones;
    const costoGN = ganancia > 0 ? importeOperacion / (1 + ganancia / 100) : 0;
    const comisionGastoFc = importeOperacion * comisionPorcentaje;
    const margen = importeOperacion - costoGN;
    const montoAcreditar = margen - comisionGastoFc;

    // ---- Escuchar historial en tiempo real ----
    useEffect(() => {
        if (!form.cuit) return;

        const ref = collection(db, "cuenta_orden", form.cuit, "historial");
        const q = query(ref, orderBy("fecha", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHistorial(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
    }, [form.cuit]);

    // ---- Guardar y Generar PDF ----
    const guardarYGenerarPDF = async () => {
        if (!form.cuit) {
            alert("El CUIT es obligatorio");
            return;
        }

        try {
            const ref = collection(db, "cuenta_orden", form.cuit, "historial");
            const datos = {
                ...form,
                proforma,
                percepciones,
                importeOperacion,
                costoGN,
                comisionPorcentaje,
                comisionGastoFc,
                margen,
                montoAcreditar,
                fecha: serverTimestamp(),
            };
            await addDoc(ref, datos);

            // Generar PDF
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Resumen de Operación", 105, 25, { align: "center" });

            doc.setFontSize(12);
            doc.text(`Cliente: ${form.cliente || "-"}`, 14, 50);
            doc.text(`Cliente GN: ${form.clienteGN || "-"}`, 14, 58);
            doc.text(`CUIT: ${form.cuit || "-"}`, 14, 66);
            doc.text(`Acción: ${form.accion || "-"}`, 14, 74);

            if (form.accion === "transferir") {
                doc.text(`Banco: ${form.banco || "-"}`, 14, 82);
                doc.text(`CBU: ${form.cbu || "-"}`, 14, 90);
                doc.text(`Titular: ${form.titular || "-"}`, 14, 98);
            }

            autoTable(doc, {
                startY: 110,
                head: [["Concepto", "Valor"]],
                body: [
                    ["Importe Factura", `$${parseFloat(form.factura || 0).toFixed(2)}`],
                    ["Proforma", `$${proforma.toFixed(2)}`],
                    ["Percepciones", `$${percepciones.toFixed(2)}`],
                    ["Importe Operación", `$${importeOperacion.toFixed(2)}`],
                    ["Costo GN", `$${costoGN.toFixed(2)}`],
                    [
                        "Comisión",
                        `${(comisionPorcentaje * 100).toFixed(2)}%  ($${comisionGastoFc.toFixed(2)})`,
                    ],
                    ["Margen", `$${margen.toFixed(2)}`],
                    ["Monto Acreditar", `$${montoAcreditar.toFixed(2)}`],
                ],
                theme: "grid",
                styles: { fontSize: 11 },
                headStyles: { fillColor: [30, 30, 30] },
            });

            doc.setFontSize(10);
            doc.text("Firma / Sello:", 14, 280);

            doc.save(`Operacion_${form.cuit}.pdf`);
            alert("Guardado en Firebase y PDF generado ✅");
        } catch (err) {
            console.error(err);
            alert("Error al guardar o generar PDF");
        }
    };

    return (
        <div className="grid gap-6 p-6">
            {/* Formulario */}
            <Card>
                <CardHeader>
                    <CardTitle>Datos de la Operación</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label>CUIT</label>
                        <Input name="cuit" value={form.cuit} onChange={handleChange} />
                    </div>
                    <div>
                        <label>Cliente</label>
                        <Input name="cliente" value={form.cliente} onChange={handleChange} />
                    </div>
                    <div>
                        <label>Cliente GN</label>
                        <Input name="clienteGN" value={form.clienteGN} onChange={handleChange} />
                    </div>
                    <div>
                        <label>Importe Factura</label>
                        <Input type="number" name="factura" value={form.factura} onChange={handleChange} />
                    </div>
                    <div>
                        <label>Importe Proforma</label>
                        <Input type="number" name="proforma" value={form.proforma} onChange={handleChange} />
                    </div>
                    <div>
                        <label>Percepciones</label>
                        <Input type="number" name="percepciones" value={form.percepciones} onChange={handleChange} />
                    </div>
                    <div>
                        <label>% Ganancia</label>
                        <Input type="number" name="ganancia" value={form.ganancia} onChange={handleChange} />
                    </div>
                    <div>
                        <label>Tipo Cliente</label>
                        <Select onValueChange={(v) => setForm({ ...form, tipoCliente: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sinFactura">Sin factura comisión</SelectItem>
                                <SelectItem value="inscripto">Inscripto</SelectItem>
                                <SelectItem value="monotributo">Monotributista</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label>Tipo Operación</label>
                        <Select onValueChange={(v) => setForm({ ...form, tipoOperacion: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="tarjeta">Con Tarjeta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Resumen */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de la Operación</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Proforma: ${proforma.toFixed(2)}</p>
                    <p>Percepciones: ${percepciones.toFixed(2)}</p>
                    <p>Importe Operación: ${importeOperacion.toFixed(2)}</p>
                    <p>Costo GN: ${costoGN.toFixed(2)}</p>
                    <p>
                        Comisión: {(comisionPorcentaje * 100).toFixed(2)}% = ${comisionGastoFc.toFixed(2)}
                    </p>
                    <p>Margen: ${margen.toFixed(2)}</p>
                    <h3 className="font-bold">Monto Acreditar: ${montoAcreditar.toFixed(2)}</h3>
                </CardContent>
            </Card>

            {/* Acciones */}
            <Card>
                <CardHeader>
                    <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <Button onClick={() => setForm({ ...form, accion: "acreditar" })}>
                            Acreditar en cuenta GN
                        </Button>
                        <Button variant="secondary" onClick={() => setForm({ ...form, accion: "transferir" })}>
                            Transferir
                        </Button>
                    </div>
                    {form.accion === "transferir" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Banco</Label>
                                <Input name="banco" value={form.banco} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>CBU / Alias</Label>
                                <Input name="cbu" value={form.cbu} onChange={handleChange} />
                            </div>
                            <div>
                                <Label>Titular</Label>
                                <Input name="titular" value={form.titular} onChange={handleChange} />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Button className="bg-blue-600 text-white" onClick={guardarYGenerarPDF}>
                            Guardar y Generar PDF
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Historial */}
            {/* Historial */}
            {historial.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Operaciones (CUIT {form.cuit})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {historial.map((h) => (
                            <div key={h.id} className="border-b py-4 mb-4">
                                <p><b>Fecha:</b> {h.fecha?.toDate?.().toLocaleString?.()}</p>
                                <p><b>Cliente:</b> {h.cliente}</p>
                                <p><b>Cliente GN:</b> {h.clienteGN}</p>
                                <p><b>Acción:</b> {h.accion}</p>
                                {h.accion === "transferir" && (
                                    <>
                                        <p><b>Banco:</b> {h.banco}</p>
                                        <p><b>CBU/Alias:</b> {h.cbu}</p>
                                        <p><b>Titular:</b> {h.titular}</p>
                                    </>
                                )}
                                <hr className="my-2" />
                                <p><b>Importe Factura:</b> ${parseFloat(h.factura || 0).toFixed(2)}</p>
                                <p><b>Proforma:</b> ${parseFloat(h.proforma || 0).toFixed(2)}</p>
                                <p><b>Percepciones:</b> ${parseFloat(h.percepciones || 0).toFixed(2)}</p>
                                <p><b>Importe Operación:</b> ${parseFloat(h.importeOperacion || 0).toFixed(2)}</p>
                                <p><b>Costo GN:</b> ${parseFloat(h.costoGN || 0).toFixed(2)}</p>
                                <p><b>Comisión:</b> {(h.comisionPorcentaje * 100).toFixed(2)}% = ${parseFloat(h.comisionGastoFc || 0).toFixed(2)}</p>
                                <p><b>Margen:</b> ${parseFloat(h.margen || 0).toFixed(2)}</p>
                                <h3 className="font-bold text-blue-600">
                                    Monto Acreditar: ${parseFloat(h.montoAcreditar || 0).toFixed(2)}
                                </h3>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
