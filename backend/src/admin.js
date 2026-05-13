import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Calcula correctamente el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Ruta absoluta al serviceAccountKey.json
const serviceAccountPath = path.join(__dirname, "certificates/serviceAccountKey.json");

// ✅ Verifica si el archivo existe
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ No se encontró serviceAccountKey.json en:", serviceAccountPath);
  process.exit(1);
}

// ✅ Evita inicializar más de una vez
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "analisisdecredito-497a4.appspot.com",
  });

  console.log("✅ Firebase Admin inicializado correctamente");
} else {
  console.log("⚠️ Firebase Admin ya estaba inicializado, se reutiliza la instancia existente");
}

export default admin;
