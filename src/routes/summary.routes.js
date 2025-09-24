import express from 'express';

import { validateJWT } from "../middlewares/auth.middleware.js";
import { createSummary, getSummaryByMeeting } from '../controllers/summary.controller.js';

const router = express.Router();

router.post('/generate', validateJWT, createSummary);
router.get('/meeting/:meetingId', validateJWT, getSummaryByMeeting);

export default router;
