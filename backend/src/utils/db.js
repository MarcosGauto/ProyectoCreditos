import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(
    process.cwd(),
    "certificates",
    "serviceAccountKey.json"
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(
            JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
        ),
    });

    console.log("🔥 Firebase Admin inicializado");
}

export const db = admin.firestore();
export const auth = admin.auth();
