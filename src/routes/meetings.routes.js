import express from 'express';
import {
  createMeeting,
  getToken,
  joinMeeting,
  getUserMeetings,
  endMeeting,
  scheduleMeeting,
  leaveMeeting
} from '../controllers/meetings.controller.js';
import { validateJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/create', validateJWT, createMeeting);
router.post('/token', validateJWT, getToken);
router.post('/join', validateJWT, joinMeeting);
router.get('/user/:userId', validateJWT, getUserMeetings);
router.post('/leave', validateJWT, leaveMeeting);
router.post('/end', validateJWT, endMeeting);
router.post('/schedule', validateJWT, scheduleMeeting);
router.post('/add-participants', validateJWT, scheduleMeeting);
router.post('/accept-invite', validateJWT, scheduleMeeting);

export default router;
