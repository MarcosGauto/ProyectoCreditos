"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function UsersPage() {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        if (!loading && role !== "admin") {
            router.push("/dashboard"); // si no es admin, lo sacamos
        }
    }, [loading, role, router]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/users", {
                    headers: {
                        Authorization: `Bearer ${await user.getIdToken()}`, // token firebase
                    },
                });
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                console.error("Error cargando usuarios:", err);
            } finally {
                setLoadingUsers(false);
            }
        };

        if (user && role === "admin") {
            fetchUsers();
        }
    }, [user, role]);

    const handleRoleChange = async (uid, newRole) => {
        try {
            await fetch(`http://localhost:5000/api/users/${uid}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${await user.getIdToken()}`,
                },
                body: JSON.stringify({ role: newRole }),
            });

            setUsers((prev) =>
                prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
            );
        } catch (err) {
            console.error("Error actualizando rol:", err);
        }
    };

    if (loading || loadingUsers) return <p>Cargando...</p>;

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Gestión de Usuarios
            </h1>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-200 text-gray-700">
                        <tr>
                            <th className="p-3">Email</th>
                            <th className="p-3">UID</th>
                            <th className="p-3">Rol</th>
                            <th className="p-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.uid} className="border-t">
                                <td className="p-3">{u.email}</td>
                                <td className="p-3 text-sm text-gray-500">{u.uid}</td>
                                <td className="p-3">{u.role || "Sin rol"}</td>
                                <td className="p-3 flex gap-2">
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => handleRoleChange(u.uid, "usuario")}
                                    >
                                        Usuario
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleRoleChange(u.uid, "admin")}
                                    >
                                        Admin
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
