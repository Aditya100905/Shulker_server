import client from '../utils/streamClient.js';
import { Meeting } from '../models/meetings.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';


const createMeeting = asyncHandler(async (req, res) => {
    const { userId, meetingId } = req.body;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    if (!meetingId) return res.status(400).json({ message: 'Meeting ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    try {
        const room = await client.video.rooms.create({
            id: meetingId,
            type: 'default',
        });

        const newMeeting = new Meeting({
            meetingId: room.id,
            createdBy: user._id,
            members: [user._id],
        });

        await newMeeting.save();

        const populatedMeeting = await Meeting.findById(newMeeting._id)
            .populate('createdBy', 'username email')
            .populate('members', 'username email');

        res.status(201).json({
            message: 'Meeting created successfully',
            meeting: populatedMeeting,
        });
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ message: 'Internal server error' });
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

    res.status(200).json({
        message: 'Joined meeting successfully',
        meeting: populatedMeeting,
    });
});


const getUserMeetings = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const meetings = await Meeting.find({ members: user._id })
        .populate('createdBy', 'username email')
        .populate('members', 'username email')
        .sort({ createdAt: -1 });

    res.status(200).json(meetings);
});


const deleteMeeting = asyncHandler(async (req, res) => {
    const { meetingId, userId } = req.body;

    if (!meetingId || !userId) return res.status(400).json({ message: 'Meeting ID and User ID required' });

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.createdBy.toString() !== userId) {
        return res.status(403).json({ message: 'Only the creator can delete the meeting' });
    }

    await meeting.remove();
    res.status(200).json({ message: 'Meeting deleted successfully' });
});



export { createMeeting, getToken, joinMeeting, getUserMeetings, deleteMeeting };
