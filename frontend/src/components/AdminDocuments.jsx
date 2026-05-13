import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchDocuments, deleteDocuments } from "@/app/utils/api"

export default function AdminDocuments() {
    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async (query = "") => {
        try {
            const data = await fetchDocuments(query);
            setDocuments(data);
        } catch (error) {
            console.error("Error al obtener documentos:", error);
        }
    };


    const handleDelete = async (id) => {
        try {
            await deleteDocuments(id);
            loadDocuments(); //recarga despues de eliminar
        } catch (error) {
            console.error(" Error al eliminar documento");
        }
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Administrador de Documentos</h2>
            <TextField
                label="Buscar por cliente o tipo"
                variant="outlined"
                fullWidth
                className="mb-4"
                onChange={(e) => { setSearch(e.target.value); fetchDocuments(e.target.value); }}
            />
            <TableContainer component={Paper} className="mt-4">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Cliente</strong></TableCell>
                            <TableCell><strong>Tipo</strong></TableCell>
                            <TableCell><strong>Fecha</strong></TableCell>
                            <TableCell><strong>Archivo</strong></TableCell>
                            <TableCell><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc._id}>
                                <TableCell>{doc.cliente}</TableCell>
                                <TableCell>{doc.tipo}</TableCell>
                                <TableCell>{new Date(doc.fecha).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <a href={doc.archivoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        Ver Archivo
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleDelete(doc._id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}
