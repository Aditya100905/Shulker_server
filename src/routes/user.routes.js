import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  getCurrentUser,
  resetPassword,
} from "../controllers/user.controller.js";
import { validateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// PUBLIC ROUTES
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshAccessToken);

// PROTECTED ROUTES
router.get("/current-user", validateJWT, getCurrentUser);

export default router;
