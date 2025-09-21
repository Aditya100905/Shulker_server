import client from '../utils/streamClient.js';
import { Meeting } from '../models/meetings.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import crypto from 'node:crypto';
import sendEmail from '../utils/sendEmail.js';

const createMeeting = asyncHandler(async (req, res) => {
    try {
        const { meetingId: providedMeetingId } = req.body || {};
        const userId = String(req.user._id);
        await client.upsertUsers([{ id: userId, role: 'user' }]);

        const meetingId = providedMeetingId || crypto.randomUUID();
        const call = client.video.call('default', meetingId);
        await call.getOrCreate({
            data: {
                created_by_id: userId,
                members: [{ user_id: userId, role: 'admin' }],
            },
        });
        const newMeeting = await Meeting.create({
            meetingId: call.id,
            createdBy: req.user._id,
            members: [req.user._id],
        });

        const populatedMeeting = await Meeting.findById(newMeeting._id)
            .populate('createdBy', 'username email')
            .populate('members', 'username email');

        return res.status(201).json({
            message: 'Meeting created successfully',
            meeting: populatedMeeting,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'meetingId already exists' });
        }
        console.error('Error creating meeting:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

const getToken = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    try {
        const token = client.createToken(user._id);

        res.status(200).json({
            message: 'Token generated successfully',
            token,
        });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


const joinMeeting = asyncHandler(async (req, res) => {
    const { userId, meetingId } = req.body;

    if (!userId || !meetingId) return res.status(400).json({ message: 'User ID and Meeting ID required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (!meeting.members.includes(user._id)) {
        meeting.members.push(user._id);
        await meeting.save();
    }

    const populatedMeeting = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members', 'username email');

    return res.status(200).json({
        message: 'Joined meeting successfully',
        meeting: populatedMeeting,
    });
});


const getUserMeetings = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user)
        return res.status(404).json({ message: 'User not found' });

    const meetings = await Meeting.find({ members: user._id })
        .populate('createdBy', 'username email avatar')
        .populate({
            path: 'members',
            select: 'username email avatar',
            perDocumentLimit: 4
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(meetings);
});


const leaveMeeting = asyncHandler(async (req, res) => {
    const { meetingId, userId } = req.body;

    if (!meetingId || !userId)
        return res.status(400).json({ message: 'Meeting ID and User ID required' });

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting)
        return res.status(404).json({ message: 'Meeting not found' });

    meeting.members.pull(userId);
    await meeting.save();

    if (meeting.createdBy.toString() === userId) {
        return res.status(403).json({ message: 'Creator cannot leave the meeting. End it instead.' });
    }

    return res.status(200).json({ message: 'Left meeting successfully' });
});


const endMeeting = asyncHandler(async (req, res) => {
    const { meetingId, userId } = req.body;

    if (!meetingId || !userId) {
        return res.status(400).json({ message: 'Meeting ID and User ID required' });
    }

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.createdBy.toString() !== String(userId)) {
        return res.status(403).json({ message: 'Only the creator can end the meeting' });
    }

    await client.upsertUsers([{ id: String(userId), role: 'user' }]);

    const call = client.video.call('default', meetingId);
    await call.end();

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    meeting.endedBy = meeting.createdBy;
    await meeting.save();

    const populated = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members', 'username email');

    return res.status(200).json({
        message: 'Meeting ended successfully',
        meeting: populated,
    });
});

const scheduleMeeting = asyncHandler(async (req, res) => {
    try {
        const { meetingId, scheduledTime, participants } = req.body;
        const userId = String(req.user._id);
        const meetingUUID = meetingId || crypto.randomUUID();

        await client.upsertUsers([{ id: userId, role: 'user' }]);

        const meeting = await Meeting.create({
            meetingId: meetingUUID,
            createdBy: userId,
            scheduledTime,
            members: [userId],
            invitedParticipants: participants,
            status: 'scheduled',
        });

        for (const email of participants) {
            const subject = 'Meeting Invitation';
            const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${meetingId}}`;
            const message = `You have been invited to a meeting.\n\nMeeting ID: ${meetingUUID}\n\nScheduled Time: ${new Date(scheduledTime).toLocaleString()}\n\nPlease click here to accept the invitation and join: ${inviteLink}`;
            await sendEmail({ email, subject, message });
        }

        const populatedMeeting = await Meeting.findById(meeting._id)
            .populate('createdBy', 'username email')
            .populate('members', 'username email');

        return res.status(201).json({ message: 'Scheduled meeting created', meeting: populatedMeeting });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

const addParticipants = asyncHandler(async (req, res) => {
    const { meetingId, participants } = req.body;
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    for (const email of participants) {
        if (!meeting.invitedParticipants.includes(email)) {
            meeting.invitedParticipants.push(email);
            const subject = 'You have been invited to a meeting';
            const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${meetingId}}`;
            const message = `You have been invited to a meeting.\n\nMeeting ID: ${meetingId}\n\nScheduled Time: ${new Date(meeting.scheduledTime).toLocaleString()}\n\nPlease click the link to accept the invitation and join: ${inviteLink}`;
            await sendEmail({ email, subject, message });
        }
    }

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members', 'username email');
    return res.status(200).json({ message: 'Participants invited', meeting: populatedMeeting });
});

const acceptInvite = asyncHandler(async (req, res) => {
    const { meetingId, email, userId } = req.body;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (!meeting.invitedParticipants.includes(email)) {
        return res.status(403).json({ message: 'No invitation found for this email' });
    }

    meeting.invitedParticipants = meeting.invitedParticipants.filter(e => e !== email);
    if (!meeting.members.includes(userId)) {
        meeting.members.push(userId);
    }

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members', 'username email');

    return res.status(200).json({ message: 'Invitation accepted, joined the meeting', meeting: populatedMeeting });
});

export { createMeeting, getToken, joinMeeting, getUserMeetings, leaveMeeting, scheduleMeeting, endMeeting, addParticipants, acceptInvite };
