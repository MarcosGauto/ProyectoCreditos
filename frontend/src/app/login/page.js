"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, loginWithGoogle } from "@/service/firebase";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    // 👇 Redirige si ya hay sesión activa
    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    // 📩 Login con email y contraseña
    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return; // evita múltiples envíos
        setLoading(true);
        try {
            await loginUser(email, password);
            router.push("/dashboard");
        } catch (err) {
            console.error("Error al iniciar sesión:", err);
            alert("Usuario o contraseña incorrectos");
        } finally {
            setLoading(false);
        }
    };

    // 🔐 Login con Google
    const handleGoogleLogin = async () => {
        if (googleLoading) return; // evita doble click
        setGoogleLoading(true);
        try {
            await loginWithGoogle();
            router.push("/dashboard");
        } catch (err) {
            if (err.code !== "auth/cancelled-popup-request") {
                console.error("Error al iniciar sesión con Google:", err);
                alert("Hubo un error con Google");
            } else {
                console.warn("Popup cancelado por otro intento de login.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleLogin}
                className="bg-white p-6 rounded shadow-md w-80"
            >
                <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>

                <input
                    type="email"
                    placeholder="Correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full p-2 rounded text-white ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {loading ? "Ingresando..." : "Ingresar"}
                </button>
            </form>

            <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className={`mt-4 w-80 p-2 rounded text-white ${googleLoading ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
                    }`}
            >
                {googleLoading ? "Conectando..." : "Ingresar con Google"}
            </button>
        </div>
    );
}
