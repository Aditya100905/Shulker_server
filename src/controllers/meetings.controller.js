import client from '../utils/streamClient.js';
import { Meeting } from '../models/meetings.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import crypto from 'node:crypto';
import sendEmail from '../utils/sendEmail.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const createMeeting = asyncHandler(async (req, res) => {
    const { meetingId: providedMeetingId } = req.body || {};
    const userId = String(req.user._id);
    await client.upsertUsers([{ id: userId, role: 'user' }]);
    const now = new Date();
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
        scheduledTime: now,
        status: 'ongoing',
        members: [{ user: req.user._id, joinedAt: new Date() }],
    });

    const populatedMeeting = await Meeting.findById(newMeeting._id)
        .populate('createdBy', 'username email')
        .populate('members.user', 'username email');

    res.json(new ApiResponse('Meeting created successfully', 201, populatedMeeting));
});

const getToken = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) throw new ApiError('User ID required', 400);
    const user = await User.findById(userId);
    if (!user) throw new ApiError('User not found', 404);

    const token = client.createToken(user._id);
    res.json(new ApiResponse('Token generated successfully', 200, { token }));
});

const joinMeeting = asyncHandler(async (req, res) => {
    const { userId, meetingId } = req.body;
    if (!userId || !meetingId) throw new ApiError('User ID and Meeting ID required', 400);
    const user = await User.findById(userId);
    if (!user) throw new ApiError('User not found', 404);
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new ApiError('Meeting not found', 404);

    const existingMemberIndex = meeting.members.findIndex(m => m.user.toString() === userId);
    if (existingMemberIndex >= 0) {
        if (meeting.members[existingMemberIndex].leftAt) {
            meeting.members[existingMemberIndex].leftAt = undefined;
            await meeting.save();
        }
    } else {
        meeting.members.push({ user: userId, joinedAt: new Date() });
        await meeting.save();
    }

    const populatedMeeting = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members.user', 'username email');

    res.json(new ApiResponse('Joined meeting successfully', 200, populatedMeeting));
});

const getUserMeetings = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) throw new ApiError('User not found', 404);

    const meetings = await Meeting.find({ 'members.user': user._id })
        .populate('createdBy', 'username email avatar')
        .populate({
            path: 'members.user',
            select: 'username email avatar',
            perDocumentLimit: 5,
        })
        .sort({ createdAt: -1 });

    res.json(new ApiResponse('Meetings fetched successfully', 200, meetings));
});

const leaveMeeting = asyncHandler(async (req, res) => {
    const { meetingId, userId } = req.body;
    if (!meetingId || !userId) throw new ApiError('Meeting ID and User ID required', 400);

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new ApiError('Meeting not found', 404);

    if (meeting.createdBy.toString() === userId) {
        throw new ApiError('Creator cannot leave the meeting. They can end it instead.', 403);
    }

    const memberObj = meeting.members.find(m => m.user.toString() === userId);
    if (memberObj && !memberObj.leftAt) {
        memberObj.leftAt = new Date();
        await meeting.save();
    }

    res.json(new ApiResponse('Left meeting successfully', 200, meeting));
});

const endMeeting = asyncHandler(async (req, res) => {
    const { meetingId, userId } = req.body;
    if (!meetingId || !userId) throw new ApiError('Meeting ID and User ID required', 400);

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new ApiError('Meeting not found', 404);

    if (meeting.createdBy.toString() !== String(userId)) {
        throw new ApiError('Only the creator can end the meeting', 403);
    }

    await client.upsertUsers([{ id: String(userId), role: 'user' }]);

    const call = client.video.call('default', meetingId);
    await call.end();

    const now = new Date();
    meeting.members.forEach(member => {
        if (!member.leftAt) {
            member.leftAt = now;
        }
    });

    meeting.status = 'ended';
    meeting.endedAt = now;
    meeting.endedBy = meeting.createdBy;
    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members.user', 'username email');

    res.json(new ApiResponse('Meeting ended successfully', 200, populatedMeeting));
});

const scheduleMeeting = asyncHandler(async (req, res) => {
    const { meetingId, scheduledTime, participants } = req.body;
    const userId = String(req.user._id);
    const meetingUUID = meetingId || crypto.randomUUID();

    await client.upsertUsers([{ id: userId, role: 'user' }]);

    const meeting = await Meeting.create({
        meetingId: meetingUUID,
        createdBy: userId,
        scheduledTime,
        members: [{ user: userId, joinedAt: new Date() }],
        invitedParticipants: participants,
        status: 'scheduled',
    });

    for (const email of participants) {
        const subject = 'Meeting Invitation';
        const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${meetingUUID}`;
        const message = `You have been invited to a meeting.\n\nMeeting ID: ${meetingUUID}\n\nScheduled Time: ${new Date(scheduledTime).toLocaleString()}\n\nPlease click here to accept the invitation and join: ${inviteLink}`;
        await sendEmail({ email, subject, message });
    }

    const populatedMeeting = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members.user', 'username email');

    res.json(new ApiResponse('Meeting scheduled successfully', 201, populatedMeeting));
});

const addParticipants = asyncHandler(async (req, res) => {
    const { meetingId, participants } = req.body;
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new ApiError('Meeting not found', 404);

    for (const email of participants) {
        if (!meeting.invitedParticipants.includes(email)) {
            meeting.invitedParticipants.push(email);
            const subject = 'You have been invited to a meeting';
            const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${meetingId}`;
            const message = `You have been invited to a meeting.\n\nMeeting ID: ${meetingId}\n\nScheduled Time: ${new Date(meeting.scheduledTime).toLocaleString()}\n\nPlease click the link to accept the invitation and join: ${inviteLink}`;
            await sendEmail({ email, subject, message });
        }
    }

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members.user', 'username email');

    res.json(new ApiResponse('Participants added and notified successfully', 200, populatedMeeting));
});

const acceptInvite = asyncHandler(async (req, res) => {
    const { meetingId, email, userId } = req.body;
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new ApiError('Meeting not found', 404);

    if (!meeting.invitedParticipants.includes(email)) {
        throw new ApiError('You are not invited to this meeting', 403);
    }

    meeting.invitedParticipants = meeting.invitedParticipants.filter(e => e !== email);

    const alreadyJoined = meeting.members.some(m => m.user.toString() === userId && !m.leftAt);
    if (!alreadyJoined) {
        meeting.members.push({ user: userId, joinedAt: new Date() });
    }

    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
        .populate('createdBy', 'username email')
        .populate('members.user', 'username email');

    res.json(new ApiResponse('Invitation accepted and joined meeting successfully', 200, populatedMeeting));
});

export {
    createMeeting,
    getToken,
    joinMeeting,
    getUserMeetings,
    leaveMeeting,
    scheduleMeeting,
    endMeeting,
    addParticipants,
    acceptInvite,
};
