// src/app/documentacion/page.js
"use client"

import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import  CalculoCuentaOrden  from "@/components/CalculoCuentaOrden"

export default function DocumentacionPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    if (loading) return <p>Cargando...</p>
    if (!user) {
        router.push("/login")
        return null
    }

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Cuenta y Orden
            </h1>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                <CalculoCuentaOrden />
            </div>
        </main>
    )
}
