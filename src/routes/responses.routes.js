import express from "express";
import { validateJWT } from "../middlewares/auth.middleware.js";
import {
  submitResponses,
  getMeetingResponses,
} from "../controllers/responses.controller.js";

const router = express.Router();

router.post("/:meetingId/responses", validateJWT, submitResponses);
router.get("/:meetingId/responses", validateJWT, getMeetingResponses);

export default router;
