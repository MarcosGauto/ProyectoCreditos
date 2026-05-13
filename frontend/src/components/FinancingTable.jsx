'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react'
import Link from "next/link";

const DEFAULT_RATES = [
    { days: 120, rate: 14.00 },
    { days: 90, rate: 10.50 },
    { days: 75, rate: 8.75 },
    { days: 60, rate: 7.00 },
    { days: 45, rate: 5.25 },
    { days: 30, rate: 3.50 },
    { days: 21, rate: 2.63 },
    { days: 15, rate: 1.75 },
    { days: 10, rate: 1.17 },
    { days: 7, rate: 0.88 },
]

export default function RatesApp() {
    const [baseRate, setBaseRate] = useState(3.50)
    const [daysList, setDaysList] = useState([120, 90, 75, 60, 45, 30, 21, 15, 10, 7])
    const [isEditingBase, setIsEditingBase] = useState(false)
    const [editBaseValue, setEditBaseValue] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [newDays, setNewDays] = useState('')

    useEffect(() => {
        const savedBaseRate = localStorage.getItem('baseRate')
        const savedDaysList = localStorage.getItem('daysList')

        if (savedBaseRate) {
            setBaseRate(parseFloat(savedBaseRate))
        }
        if (savedDaysList) {
            setDaysList(JSON.parse(savedDaysList))
        }
    }, [])

    const calculateRate = (days) => {
        const multiplier = days / 30
        return Number((baseRate * multiplier).toFixed(2))
    }

const rates = [...daysList]
    .sort((a, b) => b - a)
    .map(days => ({
        days,
        rate: calculateRate(days)
    }))


    const startEditBase = () => {
        setIsEditingBase(true)
        setEditBaseValue(baseRate.toString())
    }

    const cancelEditBase = () => {
        setIsEditingBase(false)
        setEditBaseValue('')
    }

    const saveBaseRate = () => {
        const newRate = parseFloat(editBaseValue)

        if (isNaN(newRate) || newRate < 0) {
            alert('Por favor ingresa un porcentaje válido')
            return
        }

        setBaseRate(newRate)
        localStorage.setItem('baseRate', newRate.toString())
        setIsEditingBase(false)
        setEditBaseValue('')
    }

    const addNewDays = () => {
        const days = parseInt(newDays)

        if (isNaN(days) || days <= 0) {
            alert('Por favor ingresa un número de días válido')
            return
        }

        if (daysList.includes(days)) {
            alert('Ya existe una tasa para esos días')
            return
        }

        // Add and sort by days descending
        const updatedDaysList = [...daysList, days].sort((a, b) => b - a)

        setDaysList(updatedDaysList)
        localStorage.setItem('daysList', JSON.stringify(updatedDaysList))
        setIsAdding(false)
        setNewDays('')
    }

    const cancelAdd = () => {
        setIsAdding(false)
        setNewDays('')
    }

    const deleteDays = (days) => {
        if (days === 30) {
            alert('No puedes eliminar la tasa base de 30 días')
            return
        }

        const updatedDaysList = daysList.filter(d => d !== days)
        setDaysList(updatedDaysList)
        localStorage.setItem('daysList', JSON.stringify(updatedDaysList))
    }

    return (
        <div className="min-h-screen bg-background text-black">
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Tabla de Tasas de Interés</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Panel de Administración
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Tasa Base a 30 Días</p>
                            {isEditingBase ? (
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editBaseValue}
                                        onChange={(e) => setEditBaseValue(e.target.value)}
                                        className="bg-background border-border text-foreground text-3xl font-bold max-w-[150px]"
                                        autoFocus
                                    />
                                    <span className="text-3xl font-bold text-foreground">%</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={saveBaseRate}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={cancelEditBase}
                                            className="border-border hover:bg-secondary"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-5xl font-bold text-foreground tabular-nums">
                                        {baseRate.toFixed(2)}%
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={startEditBase}
                                        className="border-border hover:bg-secondary"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>

                <div className="mb-4 flex justify-end text-black ">
                    {!isAdding && (
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 bg-red-400 hover:bg-gray-400"
                        >
                            <Plus className="h-4 w-4 mr-2 " />
                            Agregar Días
                        </Button>
                    )}
                </div>

                <Card className="bg-card border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-secondary/50">
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                                        Días
                                    </th>
                                    <th className="text-center py-4 px-6 text-sm font-semibold text-foreground">
                                        Tasa de Interés
                                    </th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-foreground">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isAdding && (
                                    <tr className="border-b border-border bg-primary/10">
                                        <td className="py-4 px-6">
                                            <Input
                                                type="number"
                                                placeholder="Días"
                                                value={newDays}
                                                onChange={(e) => setNewDays(e.target.value)}
                                                className="bg-background border-border text-foreground max-w-[120px]"
                                                autoFocus
                                            />
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-lg text-muted-foreground">
                                                {newDays && !isNaN(parseInt(newDays))
                                                    ? `${calculateRate(parseInt(newDays)).toFixed(2)}% (calculado)`
                                                    : 'Auto-calculado'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={addNewDays}
                                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                                >
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={cancelAdd}
                                                    className="border-border hover:bg-secondary"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {rates.map((item) => (
                                    <tr
                                        key={item.days}
                                        className={`border-b border-border hover:bg-secondary/30 transition-colors ${item.days === 30 ? 'bg-primary/10' : ''
                                            }`}
                                    >
                                        <td className="py-4 px-6">
                                            <span className="text-lg font-semibold text-foreground tabular-nums">
                                                {item.days}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-2xl font-bold text-foreground tabular-nums">
                                                {item.rate.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {item.days !== 30 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => deleteDays(item.days)}
                                                    className="border-border hover:bg-destructive hover:text-destructive-foreground"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
          <div className="flex justify-start mt-6 print:hidden">
            <Button
              asChild
              variant="outline"
              className="rounded-full px-4 py-1 text-sm hover:bg-gray-200 text-gray-500"
            >
              <Link href="/">← Atrás</Link>
            </Button>
          </div>
            </main>
        </div>
    )
}
