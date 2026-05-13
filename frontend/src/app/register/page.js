"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { auth, createUserWithEmailAndPassword } from "@/services/firebase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err) {
            setError("Error al registrarse: " + err.message);
        }
    };

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={handleRegister}
                className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md space-y-6 border border-gray-200"
            >
                <h1 className="text-3xl font-bold text-center text-gray-800">
                    Crear nueva cuenta
                </h1>
                <p className="text-center text-gray-500 text-sm">
                    Complete sus datos para registrarse
                </p>

                {error && (
                    <p className="text-red-600 text-sm bg-red-100 p-2 rounded-lg text-center border border-red-200">
                        {error}
                    </p>
                )}

                <Input
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                    Registrarse
                </Button>

                <p className="text-center text-sm text-gray-500">
                    ¿Ya tiene cuenta?{" "}
                    <a href="/login" className="text-gray-600 hover:text-red-600">
                        Inicie sesión aquí
                    </a>
                </p>
            </form>
        </main>
    );
}
