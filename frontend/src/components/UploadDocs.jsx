"use client"

import { useState } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, addDoc } from "firebase/firestore"
import { db, storage } from "@/service/firebase"

export default function UploadDocs({ cuit }) {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [url, setUrl] = useState(null)

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        try {
            const storageRef = ref(storage, `docs/${cuit}/${file.name}`)
            await uploadBytes(storageRef, file)
            const downloadURL = await getDownloadURL(storageRef)

            // guardar referencia en firestore
            await addDoc(collection(db, "clientes", cuit, "documentos"), {
                name: file.name,
                url: downloadURL,
                uploadedAt: new Date()
            })

            setUrl(downloadURL)
            alert("Archivo subido correctamente ✅")
        } catch (err) {
            console.error(err)
            alert("Error al subir el archivo ❌")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="p-4 border rounded">
            <h2 className="font-bold mb-2">Subir Documentos</h2>
            <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="mb-2"
            />
            <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="px-3 py-1 bg-blue-500 text-white rounded"
            >
                {uploading ? "Subiendo..." : "Subir"}
            </button>

            {url && (
                <p className="mt-2 text-sm">
                    ✅ Archivo disponible:{" "}
                    <a href={url} target="_blank" className="text-blue-600 underline">
                        {file.name}
                    </a>
                </p>
            )}
        </div>
    )
}
