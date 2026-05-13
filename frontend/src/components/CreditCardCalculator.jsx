"use client";

import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { db } from "@/service/firebase";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import LogoGn from "@/components/image/logoGn.jpg"

const installments = ["Débito", 1, 2, 3, 6, 9, 12];

// 🔹 Estructuras base
const initialCoefficients = {
  installments: ["Débito", 1, 2, 3, 6, 9, 12],
  cards: {
    VISA: [
      { puro: 0.8, final: 0 },
      { puro: 1.02, final: 0 },
      { puro: 1.03, final: 0 },
      { puro: 1.05, final: 0 },
      { puro: 1.09, final: 0 },
      { puro: 1.12, final: 0 },
      { puro: 1.17, final: 0 },
    ],
    MASTER: [
      { puro: 0.8, final: 0 },
      { puro: 1.02, final: 0 },
      { puro: 1.03, final: 0 },
      { puro: 1.05, final: 0 },
      { puro: 1.09, final: 0 },
      { puro: 1.12, final: 0 },
      { puro: 1.17, final: 0 },
    ],
    AMEX: [
      { puro: 0.8, final: 0 },
      { puro: 1.02, final: 0 },
      { puro: 1.03, final: 0 },
      { puro: 1.05, final: 0 },
      { puro: 1.09, final: 0 },
      { puro: 1.12, final: 0 },
      { puro: 1.17, final: 0 },
    ],
    CABAL: [
      { puro: 0.8, final: 0 },
      { puro: 1.02, final: 0 },
      { puro: 1.03, final: 0 },
      { puro: 1.05, final: 0 },
      { puro: 1.09, final: 0 },
      { puro: 1.12, final: 0 },
      { puro: 1.17, final: 0 },
    ],
  },
};

const initialDirectRates = {
  installments: ["Débito", 1, 2, 3, 6, 9, 12],
  cards: {
    VISA: [0, 0, 0, 0, 0, 0, 0],
    MASTER: [0, 0, 0, 0, 0, 0, 0],
    AMEX: [0, 0, 0, 0, 0, 0, 0],
    CABAL: [0, 0, 0, 0, 0, 0, 0],
  },
};

export default function CoeficientesNucleo() {
  const { role, loading } = useAuth();
  const isEditable = role === "admin";
  // --- Mover useReactToPrint justo después de useRef para mantener orden de hooks
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef, // ✅ versión nueva usa contentRef
    documentTitle: "Tasas - Coeficientes Tarjetas",
    removeAfterPrint: true,
    onAfterPrint: () => console.log("🖨️ Impresión completada correctamente"),
  });
  // ⬇️ Insertar justo acá
  console.log("🧩 Hook de impresión configurado correctamente");


  // Estados (sin cambiar nada visual ni nombres)
  const [basePrice, setBasePrice] = useState(1000);
  const [arancelDeb, setArancelDeb] = useState(0.8);
  const [arancelCre, setArancelCre] = useState(1.8);
  const [interes, setInteres] = useState(1.14);
  const [coefficients, setCoefficients] = useState(structuredClone(initialCoefficients));
  const [directRates, setDirectRates] = useState(structuredClone(initialDirectRates));
  const [prices, setPrices] = useState({ installments: [], cards: {} }); // agregado para uso en guardado
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newCardName, setNewCardName] = useState("");
  const [newInstallment, setNewInstallment] = useState("");



  // Mantener orden fijo de tarjetas
  const cardOrder = ["VISA", "MASTER", "AMEX", "CABAL"];
  // 🔥 ORDEN FORZADO DE CUOTAS
// Débito primero siempre, luego cuotas numéricas en orden, luego strings
const sortInstallments = (arr) => {
  return [...arr].sort((a, b) => {
    // Débito SIEMPRE primero
    if (a === "Débito") return -1;
    if (b === "Débito") return 1;

    const aNum = !isNaN(a);
    const bNum = !isNaN(b);

    // Si ambos son números, orden natural
    if (aNum && bNum) return Number(a) - Number(b);

    // Si uno es número → va primero
    if (aNum && !bNum) return -1;
    if (!aNum && bNum) return 1;

    // Ambos string → orden alfabético
    return a.toString().localeCompare(b.toString());
  });
};

// ⬇️ FORZAR ORDEN AL CARGAR INFO
useEffect(() => {
  setCoefficients((prev) => ({
    ...prev,
    installments: sortInstallments(prev.installments),
  }));
}, []);


  // 🔹 Función de ordenamiento reutilizable
  // 🔹 Orden: primero las tarjetas del orden fijo, luego numéricas, y los string al final
  const sortCards = (cardsObj) => {
    return Object.fromEntries(
      Object.entries(cardsObj).sort(([a], [b]) => {
        const ai = cardOrder.indexOf(a);
        const bi = cardOrder.indexOf(b);

        // 🟦 Primero respetamos el orden fijo
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;

        // 🟩 Si ninguno está en cardOrder ↓
        const aIsString = isNaN(a);
        const bIsString = isNaN(b);

        // ⬇ Los string SIEMPRE van al final
        if (aIsString && !bIsString) return 1;
        if (!aIsString && bIsString) return -1;

        // 🟧 Si ambos son string → orden alfabético
        if (aIsString && bIsString) return a.localeCompare(b);

        // 🟪 Si ambos son numéricos → comparación numérica
        return Number(a) - Number(b);
      })
    );
  };

  // 🔹 Cargar datos Firestore (igual que tu original)
  useEffect(() => {
    const ref = doc(db, "coeficientes", "coeficientesNucleo");
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const parsedCards = {};
        for (const [card, arr] of Object.entries(data.coefficients?.cards || {})) {
          parsedCards[card] = arr.map((v) =>
            typeof v === "object" ? v : { puro: Number(v) || 0, final: 0 }
          );
        }

        setBasePrice(data.basePrice || 1000);
        setArancelDeb(data.arancelDeb || 0.8);
        setArancelCre(data.arancelCre || 1.8);
        setInteres(data.interes || 1.14);
        setCoefficients({
          installments: data.coefficients?.installments || initialCoefficients.installments,
          cards: parsedCards,
        });
        setDirectRates(data.directRates || structuredClone(initialDirectRates));
        setPrices(
          data.prices ||
          structuredClone({
            installments: data.coefficients?.installments || initialCoefficients.installments,
            cards: {},
          })
        );
        setLastUpdate(data.updatedAt?.toDate?.()?.toLocaleString() || null);
      } else {
        await setDoc(ref, {
          basePrice: 1000,
          arancelDeb: 0.80,
          arancelCre: 1.8,
          interes: 1.14,
          coefficients: structuredClone(initialCoefficients),
          directRates: structuredClone(initialDirectRates),
          prices: { installments: initialCoefficients.installments, cards: {} },
          updatedAt: serverTimestamp(),
        });
      }
      setLoadingData(false);
    });

    return () => unsub();
  }, []);

  function calcularFinal(inst, puro, arDeb, arCre, interes) {
    if (!puro) return 0;

    const instNorm = inst?.toString().toUpperCase();
    if (instNorm === "DÉBITO" || instNorm === "DEBITO") {
      return parseFloat((puro * (1 + arDeb / 100)).toFixed(4));
    }
    if (instNorm === "1 CUOTA" || instNorm === "1") {
      return parseFloat((puro * (1 + arCre / 100)).toFixed(4));
    }

    const tasa = 1 + interes / 100;
    return parseFloat(((puro + arCre / 100) * tasa).toFixed(4));
  }



  // 🔹 Tasa Directa = coefFinal / (coefFinal + 100)
  const calcularTasaDirecta = (final, inst) => {
    if (inst === "DEBITO" || inst === 1) return 0;
    const coefFinal = parseFloat(final);
    const tasa = coefFinal / (coefFinal + 100);
    return (tasa * 100).toFixed(2);
  };

  // 🔹 Valor de Cuota
  const calcularValorCuota = (price, coefFinal, inst, arancelDeb, arancelCre, cuotas) => {
    const tipo = inst?.toString().toUpperCase();

    if (tipo === "DÉBITO" || tipo === "DEBITO") {
      const totalDebito = price * (1 + (Number(arancelDeb) / 100));
      return parseFloat(totalDebito.toFixed(2));
    }
    if (inst === 1) {
      const totalUnaCuota = price * (1 + (Number(arancelCre) / 100));
      return parseFloat(totalUnaCuota.toFixed(2));
    }
    const coef = Number(coefFinal) / 100;
    const cuotasNum = Number(cuotas || inst);

    const cuota = (price * (1 + coef)) / cuotasNum;
    return parseFloat(cuota.toFixed(2));
  };
  // ✅ Cálculo  precio financiado 
  const calcularPrecioFinanciado = (price, coefFinal, inst, arancelDeb, arancelCre, cuotas) => {
    const tipo = inst?.toString().toUpperCase();
    const base = parseFloat(price) || 0;

    if (tipo === "DÉBITO" || tipo === "DEBITO") {
      const deb = parseFloat(arancelDeb) || 0;
      const totalDebito = base * (1 + deb / 100);
      console.log("💳 Débito calculado:", { base, deb, totalDebito });
      return parseFloat(totalDebito.toFixed(2));
    }

    if (inst === 1) {
      const cre = parseFloat(arancelCre) || 0;
      const totalUnaCuota = base * (1 + cre / 100);
      return parseFloat(totalUnaCuota.toFixed(2));
    }

    const coef = Number(coefFinal) / 100;
    const cuotasNum = Number(cuotas || inst);

    // Total financiado = base + interés
    const total = base * (1 + coef);

    // 💰 Total general
    return parseFloat(total.toFixed(2));

    // Si querés mostrar también el valor de cada cuota:
    // const valorCuota = total / cuotasNum;
    // console.log("🧾 Detalle:", { base, coef, cuotasNum, total, valorCuota });
  };

  useEffect(() => {
    if (!coefficients?.cards) return;

    const updatedCoefficients = structuredClone(coefficients);
    const updatedDirectRates = structuredClone(directRates);

    const debitIndex = updatedCoefficients.installments.indexOf("Débito");
    const oneIndex = updatedCoefficients.installments.indexOf(1);

    const arDeb = Number(arancelDeb) || 0;
    const arCre = Number(arancelCre) || 0;
    const intFactor = Number(interes) || 1;

    Object.keys(updatedCoefficients.cards).forEach((card) => {
      // 🟢 Débito
      if (debitIndex !== -1) {
        updatedCoefficients.cards[card][debitIndex].puro = arDeb;
        updatedCoefficients.cards[card][debitIndex].final = parseFloat(arDeb.toFixed(2));

        if (updatedDirectRates.cards?.[card]) {
          updatedDirectRates.cards[card][debitIndex] = 0;
        }

        // 💳 Precio financiado Débito
        const inst = "Débito";
        const precioFinanciadoDebito = calcularPrecioFinanciado(basePrice, 0, inst, arDeb, arCre);
        console.log("💳 Precio Financiado Débito:", {
          card,
          basePrice,
          arDeb,
          precioFinanciadoDebito,
        });

        // ✅ Modificado: mostrar total correcto
        updatedCoefficients.cards[card][debitIndex].precioFinanciado = basePrice + (basePrice * arDeb / 100);
      }

      // 🔵 1 cuota → igual al arancel crédito
      if (oneIndex !== -1) {
        updatedCoefficients.cards[card][oneIndex].puro = arCre;
        updatedCoefficients.cards[card][oneIndex].final = arCre;
        if (updatedDirectRates.cards?.[card]) {
          updatedDirectRates.cards[card][oneIndex] = 0;
        }

        // 💳 Precio financiado 1 Cuota
        const inst = 1;
        const precioFinanciadoUnaCuota = calcularPrecioFinanciado(basePrice, 0, inst, arDeb, arCre);
        console.log("💳 Precio Financiado 1 Cuota:", {
          card,
          basePrice,
          arCre,
          precioFinanciadoUnaCuota,
        });

        // ✅ Modificado: mostrar total correcto
        updatedCoefficients.cards[card][oneIndex].precioFinanciado = basePrice + (basePrice * arCre / 100);
      }

      // 🟣 Resto de cuotas → recalcula final, tasa directa y precio financiado
      const list = Array.isArray(updatedCoefficients.cards[card])
        ? updatedCoefficients.cards[card]
        : Object.values(updatedCoefficients.cards[card] || {});

      updatedCoefficients.cards[card] = list.map((item, idx) => {
        const inst = updatedCoefficients.installments[idx];
        if (inst === "Débito" || inst === 1) return item;

        const puro = Number(item.puro) || 0;
        const final = parseFloat(((puro + arCre) * intFactor).toFixed(4));
        const tasaDirecta = calcularTasaDirecta(final, inst);

        const precioFinanciado = calcularPrecioFinanciado(basePrice, final, inst, arDeb, arCre);

        // Actualiza el array de tasas directas también
        if (updatedDirectRates.cards?.[card]) {
          updatedDirectRates.cards[card][idx] = tasaDirecta;
        }

        return { ...item, final, tasaDirecta, precioFinanciado };
      });
    });

    setCoefficients((prev) => {
      const jsonPrev = JSON.stringify(prev.cards);
      const jsonNew = JSON.stringify(updatedCoefficients.cards);
      return jsonPrev !== jsonNew ? updatedCoefficients : prev;
    });

    setDirectRates((prev) => {
      const jsonPrev = JSON.stringify(prev.cards);
      const jsonNew = JSON.stringify(updatedDirectRates.cards);
      return jsonPrev !== jsonNew ? updatedDirectRates : prev;
    });
  }, [arancelDeb, arancelCre, interes, coefficients.cards]);


  // 🔹 Manejar cambio del coeficiente puro (dinámico, tipo "excel")
  const handleCoefficientChange = (card, idx, value, inst) => {
    setCoefficients((prev) => {
      const next = structuredClone(prev);
      if (!next.cards[card][idx]) next.cards[card][idx] = {};

      const cell = next.cards[card][idx];

      // Si el valor está vacío o "-0", marcamos visualmente como deshabilitado
      if (value.trim() === "" || value.trim() === "-0") {
        cell.puro = value.trim();
        cell.final = "";
        cell.valorCuota = "";
        cell.precioFinanciado = "";
        // 👇 Ya no bloqueamos la edición, solo dejamos un flag visual
        cell.isDisabledVisual = true;
        return next;
      }

      // Si el usuario vuelve a escribir algo → reactivamos
      cell.puro = value;
      cell.isDisabledVisual = false;

      const final = parseFloat(value) || 0;
      cell.final = final;

      // Recalcular valores dependientes
      const valorCuota = calcularValorCuota(basePrice, final, inst, arancelDeb, arancelCre);
      const precioFinanciado = calcularPrecioFinanciado(basePrice, final, inst, arancelDeb, arancelCre);

      cell.valorCuota = valorCuota;
      cell.precioFinanciado = precioFinanciado;

      return next;
    });
  };


  // 🔹 Guardar todos los cambios (solo al presionar guardar)
  const handleSaveAll = async () => {
    if (!isEditable) return;
    setSaving(true);

    try {
      // Recalcular coeficientes finales y tasas antes de guardar (aseguro consistencia)
      const newCoefficients = structuredClone(coefficients);
      const newDirectRates = structuredClone(directRates);
      const newPrices = structuredClone(prices);

      for (const [card, arr] of Object.entries(newCoefficients.cards)) {
        arr.forEach((obj, i) => {
          const inst = newCoefficients.installments[i];
          const final = calcularFinal(inst, obj.puro, arancelDeb, arancelCre, interes);
          newCoefficients.cards[card][i].final = final;

          // Tasa directa
          const tasa = calcularTasaDirecta(final);
          newDirectRates.cards[card][i] = tasa;

          // Precio financiado total
          const precioFin = calcularPrecioFinanciado(
            basePrice,        // precio base (correcto)
            final,            // coefFinal
            inst,             // número de cuota
            arancelDeb,
            arancelCre
          );

          if (!newPrices.cards[card]) newPrices.cards[card] = [];
          newPrices.cards[card][i] = precioFin;
        });
      }

      // Guardar en Firestore
      await setDoc(doc(db, "coeficientes", "coeficientesNucleo"), {
        basePrice,
        arancelDeb,
        arancelCre,
        interes,
        coefficients: newCoefficients,
        directRates: newDirectRates,
        prices: newPrices,
        updatedAt: serverTimestamp(),
      });

      // Actualizar estados locales
      setCoefficients(newCoefficients);
      setDirectRates(newDirectRates);
      setPrices(newPrices);

      alert("✅ Configuración guardada correctamente");
    } catch (err) {
      console.error(err);
      alert("❌ Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Agregar tarjeta (mantengo tu implementación exacta)
  // 🔹 Agregar tarjeta (corregido — usa setCoefficients en vez de setCards)
  const handleAddCard = () => {
    if (!newCardName || !newCardName.trim()) return alert("Ingresá un nombre de tarjeta");

    const clean = newCardName.trim();

    // Si ya existe la tarjeta, aviso y salgo
    if (coefficients.cards?.[clean]) {
      setNewCardName("");
      return alert("⚠️ Esa tarjeta ya existe");
    }

    setCoefficients((prev) => {
      const next = structuredClone(prev);

      // Aseguro que existe el array de installments y tomo su longitud
      const len = (next.installments || []).length || 0;

      // Creo la estructura base para la nueva tarjeta (cada cuota un objeto)
      const base = Array.from({ length: len }, () => ({ puro: 0, final: 0 }));

      // Inserto la nueva tarjeta
      next.cards = { ...(next.cards || {}), [clean]: base };

      // Aplico sortCards para que respete tu orden (y deje strings al final)
      next.cards = sortCards(next.cards);

      return next;
    });

    setNewCardName("");
  };




  const handleDeleteCard = (card) => {
    if (!confirm(`¿Eliminar tarjeta "${card}"?`)) return;
    setCoefficients((p) => {
      const next = structuredClone(p);
      delete next.cards[card];
      return next;
    });
    setDirectRates((p) => {
      const next = structuredClone(p);
      delete next.cards[card];
      return next;
    });
  };

  // 🔹 Agregar cuota correlativa (respeta ["Débito",1,2,3,6,9,12,18,24,...])
  function handleAddInstallment() {
    const raw = newInstallment?.trim();

    if (!raw) {
      alert("Ingrese un valor");
      return;
    }

    const isNumber = /^\d+$/.test(raw); // Solo dígitos → número válido

    // --- SI ES NÚMERO ---
    if (isNumber) {
      const num = parseInt(raw, 10);

      if (num <= 0) {
        alert("Ingrese un número de cuotas válido");
        return;
      }

      if (coefficients.installments.includes(num)) {
        alert("⚠️ Esa cuota ya existe");
        return;
      }

      setCoefficients(prev => {
        const next = structuredClone(prev);

        next.installments.push(num);

        // mantener orden numérico
        next.installments.sort((a, b) => a - b);

        // agregar estructura a cada tarjeta existente
        Object.keys(next.cards).forEach(card => {
          next.cards[card].push({ puro: 0, final: 0 });
        });

        return next;
      });

      setNewInstallment("");
      return;
    }

    // --- SI ES STRING ---
    const str = raw.toUpperCase();

    if (coefficients.installments.includes(str)) {
      alert("⚠️ Esa cuota ya existe");
      return;
    }

    setCoefficients(prev => {
      const next = structuredClone(prev);

      next.installments.push(str);

      // deja strings al final
      next.installments = next.installments.sort((a, b) => {
        const an = /^\d+$/.test(a);
        const bn = /^\d+$/.test(b);
        if (an && !bn) return -1;
        if (!an && bn) return 1;
        return an && bn ? a - b : 0;
      });

      // agregar base para todas las tarjetas
      Object.keys(next.cards).forEach(card => {
        next.cards[card].push({ puro: 0, final: 0 });
      });

      return next;
    });

    setNewInstallment("");
  }


  if (loading || loadingData)
    return <div className="flex h-screen items-center justify-center text-gray-500">Cargando...</div>;



  // 🔥 Ordenar tarjetas garantizando que DÉBITO quede siempre primero
  const orderedCards = Object.keys(coefficients.cards);
// 🔹 Ordenar cuotas dejando siempre "Débito" primero
const orderedInstallments = [...coefficients.installments].sort((a, b) => {
  if (a === "Débito") return -1;
  if (b === "Débito") return 1;

  return Number(a) - Number(b); // orden numérico
});


  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-red-700">Coeficientes Núcleo</h1>

          <div className="flex items-center gap-3">
            {isEditable && (
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="!bg-red-200 !text-red-800"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            )}

            <Button
              onClick={() => {
                if (!printRef.current) {
                  alert("❌ No se encontró el contenido para imprimir");
                  console.error("🧩 printRef.current:", printRef.current);
                  return;
                }
                handlePrint();
              }}
              className="!bg-gray-200 !text-gray-800"
            >
              Imprimir / Exportar
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 border border-red-100 rounded" ref={printRef}>
          {/* ENCABEZADO */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-gray-500">Grupo Núcleo S.A.</div>
              <div className="text-xs text-gray-400">Coeficientes Grupo Núcleo S.A.</div>
            </div>

            <div className="w-28 h-14 relative">
              <Image
                src={LogoGn}
                alt="Logo"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>

          {lastUpdate && (
            <p className="text-sm text-gray-500 mb-3">
              Última actualización: {lastUpdate}
            </p>
          )}

          {/* CONTROLES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-gray-500 print:hidden">
            <div>
              <Label>PVP contado</Label>
              <Input
                type="number"
                value={basePrice}
                onChange={e => setBasePrice(Number(e.target.value))}
              />
            </div>

            <div className="print:hidden">
              <Label>Arancel Debito (%)</Label>
              <Input
                type="number"
                value={arancelDeb}
                onChange={e => isEditable && setArancelDeb(Number(e.target.value))}
                readOnly={!isEditable}
              />
            </div>

            <div className="print:hidden">
              <Label>Arancel Crédito (%)</Label>
              <Input
                type="number"
                value={arancelCre}
                onChange={e => isEditable && setArancelCre(Number(e.target.value))}
                readOnly={!isEditable}
              />
            </div>

            <div>
              <Label>Interés (%)</Label>
              <Input
                type="number"
                value={interes}
                onChange={e => isEditable && setInteres(Number(e.target.value))}
                readOnly={!isEditable}
              />
            </div>
          </div>

          {/* COEFICIENTES */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-red-500">
                COEFICIENTES TARJETAS
              </h3>

              {isEditable && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nueva tarjeta..."
                    value={newCardName}
                    onChange={e => setNewCardName(e.target.value)}
                    className="w-40 text-gray-600 print:hidden"
                  />

                  <Button onClick={handleAddCard} size="sm" className="print:hidden">
                    Agregar tarjeta
                  </Button>

                  {/* 🗑️ Eliminar tarjeta */}
                  <Button
                    onClick={() => {
                      const cardToDelete = prompt(
                        "Ingrese el nombre exacto de la tarjeta a eliminar:"
                      );
                      if (!cardToDelete) return;

                      if (!coefficients.cards[cardToDelete]) {
                        alert("⚠️ Esa tarjeta no existe");
                        return;
                      }

                      if (!confirm(`¿Eliminar la tarjeta "${cardToDelete}"?`))
                        return;

                      setCoefficients(prev => {
                        const next = structuredClone(prev);
                        delete next.cards[cardToDelete];
                        return next;
                      });

                      setDirectRates(prev => {
                        const next = structuredClone(prev);
                        delete next.cards[cardToDelete];
                        return next;
                      });
                    }}
                    size="sm"
                    className="bg-red-50 text-red-700 print:hidden"
                  >
                    🗑️ Eliminar tarjeta
                  </Button>
                  {/* ➕ Input de nueva cuota */}
                  <Input
                    placeholder="Nueva cuota..."
                    value={newInstallment}
                    onChange={(e) => setNewInstallment(e.target.value)}
                    className="w-32 text-gray-600 print:hidden"
                  />

                  {/* ➕ Agregar cuota */}
                  <Button
                    onClick={() => handleAddInstallment()}
                    size="sm"
                    className="bg-red-100 text-red-700 print:hidden"
                  >
                    Agregar cuota
                  </Button>

                  {/* 🗑️ Eliminar cuota */}
                  <Button
                    onClick={() => {
                      const cuotaToDelete = prompt(
                        "Ingrese el nombre o número de la cuota a eliminar:"
                      );
                      if (!cuotaToDelete) return;

                      setCoefficients(prev => {
                        const next = structuredClone(prev);
                        const i = next.installments.indexOf(
                          Number(cuotaToDelete)
                        );

                        if (i === -1) {
                          alert("⚠️ Esa cuota no existe");
                          return prev;
                        }

                        if (!confirm(`¿Eliminar la cuota "${cuotaToDelete}"?`))
                          return prev;

                        next.installments.splice(i, 1);

                        for (const card of Object.keys(next.cards)) {
                          next.cards[card].splice(i, 1);
                        }

                        return next;
                      });

                      setDirectRates(prev => {
                        const next = structuredClone(prev);
                        const i = next.installments.indexOf(
                          Number(cuotaToDelete)
                        );

                        if (i === -1) return prev;

                        next.installments.splice(i, 1);

                        for (const card of Object.keys(next.cards)) {
                          next.cards[card].splice(i, 1);
                        }

                        return next;
                      });
                    }}
                    size="sm"
                    className="bg-red-50 text-red-700 print:hidden"
                  >
                    🗑️ Eliminar cuota
                  </Button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-red-50">
                    <th className="border px-2 py-1 text-center text-gray-500">
                      Cuotas
                    </th>

                    {orderedCards.map(card => (
                      <th
                        key={card}
                        className="border px-2 py-1 text-center text-gray-500"
                      >
                        {card}

                        {isEditable && (
                          <button
                            onClick={() => handleDeleteCard(card)}
                            className="ml-1 text-red-500 hover:text-red-700 text-xs"
                          >
                            🗑️
                          </button>
                        )}
                      </th>
                    ))}

                    {isEditable && (
                      <th className="border px-2 py-1 text-center text-gray-500">
                        Acción
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {orderedInstallments.map((inst, idx) => (
                    <tr key={inst}>
                      <td className="border px-2 py-1 text-gray-500 text-center">
                        {inst}
                      </td>

                      {orderedCards.map(card => {
                        const cell = coefficients.cards[card]?.[idx] ?? {};

                        return (
                          <td
                            key={card}
                            className={`border px-2 py-1 text-center ${cell.isDisabledVisual
                              ? "bg-gray-200 text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {isEditable ? (
                              <div className="flex flex-col items-center ">
                                <input
                                  type="text"
                                  value={cell.puro ?? ""}
                                  onChange={e =>
                                    handleCoefficientChange(
                                      card,
                                      idx,
                                      e.target.value,
                                      inst
                                    )
                                  }
                                  className={`w-full text-center border border-gray-200 mb-1 print:hidden ${cell.isDisabledVisual
                                    ? "bg-gray-200 text-gray-400 "
                                    : ""
                                    }`}
                                />

                                <span
                                  className={`text-xs print:block${cell.isDisabledVisual
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                    }`}
                                >
                                  {cell.isDisabledVisual
                                    ? "-"
                                    : `${cell.final ?? 0}%`}
                                </span>
                              </div>
                            ) : (
                              <span>
                                {cell.isDisabledVisual
                                  ? "-"
                                  : `${cell.final ?? 0}%`}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {isEditable && inst !== "Débito" && (
                        <td className="border px-2 py-1 text-center">
                          <button
                            onClick={() => {
                              if (!confirm(`¿Eliminar la cuota "${inst}"?`))
                                return;

                              setCoefficients(prev => {
                                const next = structuredClone(prev);
                                const i = next.installments.indexOf(inst);

                                if (i > -1) {
                                  next.installments.splice(i, 1);

                                  for (const card of Object.keys(next.cards)) {
                                    next.cards[card].splice(i, 1);
                                  }
                                }

                                return next;
                              });

                              setDirectRates(prev => {
                                const next = structuredClone(prev);
                                const i = next.installments.indexOf(inst);

                                if (i > -1) {
                                  next.installments.splice(i, 1);

                                  for (const card of Object.keys(next.cards)) {
                                    next.cards[card].splice(i, 1);
                                  }
                                }

                                return next;
                              });
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            🗑️
                          </button>
                        </td>
                      )}

                      {isEditable && inst === "Débito" && (
                        <td className="border"></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* TASA DIRECTA */}
          <section className="print:hidden">
            <h3 className="text-lg font-semibold text-red-500 mb-2">
              TASA DIRECTA
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-red-50">
                    <th className="border px-2 py-1 text-center text-gray-500">
                      Cuotas
                    </th>

                    {orderedCards.map(card => (
                      <th
                        key={card}
                        className="border px-2 py-1 text-center text-gray-500"
                      >
                        {card}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {orderedInstallments.map((inst, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1 text-center text-gray-600">
                        {inst}
                      </td>

                      {orderedCards.map(card => {
                        return (
                          <td
                            key={card}
                            className={`border px-2 py-1 text-center ${coefficients.cards[card]?.[idx]?.isDisabledVisual
                              ? "bg-gray-200 text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {coefficients.cards[card]?.[idx]?.isDisabledVisual
                              ? "-"
                              : `${coefficients.cards[card]?.[idx]?.tasaDirecta ?? "-"} %`}

                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* VALOR CUOTA */}
          <section className="print:hidden">
            <h3 className="text-lg font-semibold text-red-500 mb-2">
              VALOR CUOTA
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-red-50">
                    <th className="border px-2 py-1 text-center text-gray-500">
                      Cuotas
                    </th>

                    {orderedCards.map(card => (
                      <th
                        key={card}
                        className="border px-2 py-1 text-center text-gray-500"
                      >
                        {card}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {orderedInstallments.map((inst, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1 text-center text-gray-600">
                        {inst}
                      </td>

                      {orderedCards.map(card => {
                        return (
                          <td
                            key={card}
                            className={`border px-2 py-1 text-center ${coefficients.cards[card]?.[idx]?.isDisabledVisual
                              ? "bg-gray-200 text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {coefficients.cards[card]?.[idx]?.isDisabledVisual
                              ? "-"
                              : `$${calcularValorCuota(
                                basePrice,
                                coefficients.cards[card]?.[idx]?.final ?? 0,
                                inst,
                                arancelDeb,
                                arancelCre
                              ).toLocaleString("es-AR", {
                                minimumFractionDigits: 2
                              })}`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* PRECIO FINANCIADO */}
          <section className="print:hidden">
            <h3 className="text-lg font-semibold text-red-500 mb-2 ">
              PRECIO FINANCIADO
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-red-50">
                    <th className="border px-2 py-1 text-center text-gray-500">
                      Cuotas
                    </th>

                    {orderedCards.map(card => (
                      <th
                        key={card}
                        className="border px-2 py-1 text-center text-gray-500"
                      >
                        {card}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {orderedInstallments.map((inst, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1 text-center text-gray-600">
                        {inst}
                      </td>

                      {orderedCards.map(card => {
                        return (
                          <td
                            key={card}
                            className={`border px-2 py-1 text-center ${coefficients.cards[card]?.[idx]?.isDisabledVisual
                              ? "bg-gray-200 text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {coefficients.cards[card]?.[idx]?.isDisabledVisual
                              ? "-"
                              : `$${(coefficients.cards[card]?.[idx]?.precioFinanciado ?? 0).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 }
                              )}`}
                          </td>

                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex justify-start mt-6 print:hidden">
            <Button
              asChild
              variant="outline"
              className="rounded-full px-4 py-1 text-sm hover:bg-gray-200 text-gray-500"
            >
              <Link href="/">← Atrás</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
