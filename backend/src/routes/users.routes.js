import express from "express";
import auth from "../admin.js";

const router = express.Router();

/**
 * GET /api/users/me
 * Devuelve el usuario autenticado usando Firebase Auth
 */
router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = header.replace("Bearer ", "");

    // 🔥 Verificamos el token Firebae
    const decoded = await auth.verifyIdToken(token);

    return res.json({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || null,
      picture: decoded.picture || null,
    });
  } catch (error) {
    console.error("❌ Error verificando token:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
