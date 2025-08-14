import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  getCurrentUser,
  resetPassword,
  googleAuthCallback,
} from "../controllers/user.controller.js";
import { validateJWT } from "../middlewares/auth.middleware.js";
import passport from "passport";

const router = Router();

// PUBLIC ROUTES
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshAccessToken);
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleAuthCallback
);

// PROTECTED ROUTES
router.get("/current-user", validateJWT, getCurrentUser);
router.post("/logout", validateJWT, logoutUser);

export default router;
