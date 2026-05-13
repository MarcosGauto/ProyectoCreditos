"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UsdHistory() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [datos, setDatos] = useState([]);
  const [usdHoy, setUsdHoy] = useState(null);
  const [mensaje, setMensaje] = useState("");

  // 🔹 Al entrar a la página, trae y guarda el USD actual
  useEffect(() => {
    const obtenerUsdHoy = async () => {
      try {
        const res = await fetch("http://localhost:5000/usd");
        if (!res.ok) throw new Error("Error al obtener USD actual");
        const data = await res.json();

        setUsdHoy({
          fecha: new Date().toLocaleDateString("es-AR"),
          venta: data.venta ?? "N/A",
        });

        if (data.guardado) {
          console.log("✅ Registro guardado en Firestore.");
        } else {
          console.log("ℹ Registro ya existía, no se guardó.");
        }
      } catch (err) {
        console.error("Error:", err);
        setMensaje("Error al obtener la cotización actual.");
      }
    };
    obtenerUsdHoy();
  }, []);

  // 🔍 Buscar histórico
 const buscarHistorico = async () => {
  try {
    if (!fechaSeleccionada) {
      setMensaje("Seleccioná una fecha para buscar.");
      return;
    }

    const fechaFormateada = fechaSeleccionada.split("-").reverse().join("-");
    console.log("Buscando en Firestore:", fechaFormateada);

    const res = await fetch(`http://localhost:5000/usd/historial?fecha=${fechaSeleccionada}`);

    // 👇 AGREGAMOS ESTO para ver qué devuelve el backend
    const text = await res.text();
    console.log("🔎 Respuesta cruda del backend:", text);

    if (!res.ok) throw new Error("Error al buscar histórico");

    const data = JSON.parse(text);

    if (data.message) {
      setDatos([]);
      setMensaje("No se encontraron registros para esa fecha.");
    } else {
      setDatos(data);
      setMensaje("");
    }
  } catch (err) {
    console.error("Error:", err);
    setMensaje("Error al buscar histórico.");
  }
};

  return (
    <div className="flex justify-center pt-16 pb-10 bg-gray-100 min-h-screen">
      <Card className="p-6 shadow-lg w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-red-700">
            Histórico USD Oficial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 💵 USD de hoy */}
          {usdHoy && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center mb-6">
              <h3 className="font-semibold text-green-700">
                Dólar oficial de hoy ({usdHoy.fecha})
              </h3>
              <p className="text-green-900 mt-1">
                <strong>Venta:</strong> {usdHoy.venta}
              </p>
            </div>
          )}

          {/* Selector de fecha */}
          <div className="w-full flex justify-center mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 border rounded-xl bg-gray-50 shadow-sm w-full max-w-md">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Fecha anterior:
              </label>
              <Input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="w-full sm:w-auto border-red-600 focus:ring-red-700 focus:border-red-700 text-sm"
              />
              <Button
                onClick={buscarHistorico}
                className="bg-red-700 hover:bg-red-800 text-white rounded-lg px-4 py-2 text-sm"
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Mensaje informativo */}
          {mensaje && (
            <p className="text-center text-sm text-gray-600 mb-4">{mensaje}</p>
          )}

          {/* Tabla de resultados */}
          {datos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center shadow-sm">
                <thead>
                  <tr className="bg-red-700 text-white">
                    <th className="border p-2">Fecha</th>

                    <th className="border p-2">Dolar GBP</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((item, index) => (
                    <tr key={index} className="bg-gray-100">
                      <td className="border p-2">{item.fecha}</td>
                      <td className="border p-2">{item.precioDolar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Botón Atrás */}
          <div className="flex justify-start mt-6">
            <Button
              asChild
              variant="outline"
              className="rounded-full px-4 py-1 text-sm hover:bg-gray-200"
            >
              <Link href="/">← Atrás</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
