// src/app/documentacion/page.js
"use client"

import { useEffect } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import { CuitForm } from "@/components/Cuit-form"

export default function DocumentacionPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [loading, user, router])

    if (loading) return <p>Cargando...</p>

    // Mientras redirige, no renderizamos nada
    if (!user) return null

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Documentación - Calificación
            </h1>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                <CuitForm />

            </div>
        </main>
    )
}
