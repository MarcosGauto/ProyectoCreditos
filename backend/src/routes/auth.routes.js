// backend/routes/auth.routes.js
import { Router } from "express";
import firebaseAuth from "../middlewares/firebaseAuth.js";
import { me, verifyToken } from "../controllers/auth.controller.js";

const router = Router();

// Devuelve los datos del usuario del token (protegido)
router.get("/me", firebaseAuth, me);

// Verificar token enviado en body (útil para debug/testing)
router.post("/verify", verifyToken);

export default router;
