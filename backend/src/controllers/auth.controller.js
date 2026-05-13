// backend/controllers/auth.controller.js
export const me = async (req, res) => {
    try {
        // El middleware firebaseAuth ya colocó req.user
        if (!req.user) return res.status(401).json({ ok: false, error: "No authenticated user" });

        // Podés enriquecer con lectura en Firestore si querés:
        // const userDoc = await firestore.collection('users').doc(req.user.uid).get();

        return res.json({
            ok: true,
            user: {
                uid: req.user.uid,
                email: req.user.email || null,
                name: req.user.name || null,
                phone_number: req.user.phone_number || null,
                // cualquier custom claim:
                claims: req.user,
            },
        });
    } catch (e) {
        console.error("auth.me error", e);
        return res.status(500).json({ ok: false, error: e.message });
    }
};

export const verifyToken = async (req, res) => {
    try {
        // Este endpoint permite verificar un token enviado en body (útil para testing)
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ ok: false, error: "idToken required in body" });

        const decoded = await req.app.get("firebaseAdmin").auth().verifyIdToken(idToken).catch(async () => {
            // fallback si no guardaste admin en app
            // No necesario si usás import admin directamente:
        });

        // Si usás admin import:
        // import admin from '../firebase/admin.js'
        // const decoded = await admin.auth().verifyIdToken(idToken);

        return res.json({ ok: true, decoded });
    } catch (err) {
        console.error("verifyToken error", err);
        return res.status(401).json({ ok: false, error: "Invalid token" });
    }
};
