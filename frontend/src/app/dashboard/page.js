"use client";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/service/firebase";
import {
    User,
    FileText,
    Calculator,
    DollarSign,
    Archive,
    CreditCard,
    LogOut,
} from "lucide-react";

export default function DashboardPage() {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login"); // <-- corregido
        }
    }, [user, loading, router]);

    if (loading || !user) return <p>Cargando...</p>;

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const commonSections = [
        { title: "Cuenta y Orden", icon: User, color: "text-blue-600", href: "/CalculoCuentaOrden" },
        { title: "Histórico USD", icon: DollarSign, color: "text-green-600", href: "/usd-history" },
        { title: "Cálculo Diferencia USD", icon: Calculator, color: "text-indigo-600", href: "/exchange" },
        { title: "Coeficiente Tarjetas", icon: CreditCard, color: "text-purple-600", href: "/coefficient" },
        { title: "Calificación Crediticia", icon: FileText, color: "text-orange-600", href: "/documentation" },
        { title: "Calculo Tasas", icon: Archive, color: "text-gray-600", href: "/financing" },
    ];

    const adminSections = [
        { title: "Gestión de Usuarios", icon: User, color: "text-red-600", href: "/users" },
    ];

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Centro de Gestión</h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {[...commonSections, ...(role === "admin" ? adminSections : [])].map((section) => (
                    <Link
                        key={section.title}
                        href={section.href}
                        className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl hover:border-gray-300 transition transform hover:-translate-y-1"
                    >
                        <section.icon
                            className={`w-12 h-12 ${section.color} mb-4 group-hover:scale-110 transition`}
                        />
                        <h2 className="text-lg font-semibold text-gray-800 group-hover:text-red-600">
                            {section.title}
                        </h2>
                    </Link>
                ))}
            </div>
        </main>
    );
}
