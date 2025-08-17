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
  editUserProfile,
  changePassword,
  verifyEmail,
  sendEmailVerification,
} from "../controllers/user.controller.js";
import { validateJWT } from "../middlewares/auth.middleware.js";
import passport from "passport";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// PUBLIC ROUTES
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshAccessToken);

router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleAuthCallback
);

router.get("/verify-email/:token", verifyEmail);

// PROTECTED ROUTES
router.get("/current-user", validateJWT, getCurrentUser);
router.post("/update-avatar", validateJWT, upload.single("avatar"), updateAvatar);
router.post("/logout", validateJWT, logoutUser);
router.post("/edit-profile", validateJWT, editUserProfile);
router.post("/change-password", validateJWT, changePassword);
router.post("/send-email-verification", validateJWT, sendEmailVerification);

export default router;
