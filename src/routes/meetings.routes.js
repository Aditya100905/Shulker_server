import express from 'express';
import {
  createMeeting,
  getToken,
  joinMeeting,
  getUserMeetings,
  deleteMeeting,
  endMeeting
} from '../controllers/meetings.controller.js';

const router = express.Router();

router.post('/create', createMeeting);
router.post('/token', getToken);
router.post('/join', joinMeeting);
router.get('/user/:userId', getUserMeetings);
router.delete('/delete', deleteMeeting);
router.post('/end', endMeeting);

export default router;
