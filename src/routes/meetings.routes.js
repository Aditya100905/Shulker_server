import express from 'express';
import {
  createMeeting,
  getToken,
  joinMeeting,
  getUserMeetings,
  endMeeting,
  scheduleMeeting,
  leaveMeeting,
  addRecordingUrl,
  getRecordingbyMeetingId,
  getAllRecordings
} from '../controllers/meetings.controller.js';
import { validateJWT } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js';

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
router.post('/add-recording', validateJWT,upload.single("recording"), addRecordingUrl);
router.get('/recordings/:meetingId', validateJWT, getRecordingbyMeetingId);
router.get('/recordings', validateJWT, getAllRecordings);

export default router;
