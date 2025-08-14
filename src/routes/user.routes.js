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
  updateAvatar,
} from "../controllers/user.controller.js";
import { validateJWT } from "../middlewares/auth.middleware.js";
import passport from "passport";
import { uploadWithDestination } from "../middlewares/multer.middleware.js";

const router = Router();

const fields = [
  {
    name: 'avatar',
    maxCount: 1
  }];


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
router.post("/update-avatar", validateJWT, uploadWithDestination('any', fields, './uploads/profile/avatar'), updateAvatar);

// PROTECTED ROUTES
router.get("/current-user", validateJWT, getCurrentUser);
router.post("/logout", validateJWT, logoutUser);

export default router;
