import express from "express";
import { validateJWT } from "../middlewares/auth.middleware.js";
import {
  addQuestionsToMeeting,
  getMeetingQuestions,
} from "../controllers/questions.controller.js";

const router = express.Router();

router.post("/:meetingId/questions", validateJWT, addQuestionsToMeeting);
router.get("/:meetingId/questions", validateJWT, getMeetingQuestions);

export default router;
