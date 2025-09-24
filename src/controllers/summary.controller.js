import { Summary } from "../models/summary.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiResponse } from "../utils/ApiResponse";

const createSummary = asyncHandler(async (req, res) => {
    try {
        const { meetingId, content, actionItems } = req.body;
        const existingSummary = await Summary.findOne({ meeting: meetingId });
        if (existingSummary) {
            return res.status(400).json(new ApiResponse('Summary already exists for this meeting', 400));
        }
        const summary = new Summary({
            meeting: meetingId,
            content,
            actionItems,
        });
        await summary.save();
        return res.status(201).json(new ApiResponse('Summary created successfully', 201, summary));
    } catch (error) {
        return new ApiError('Failed to create summary', 500, error);
    }
});

const getSummaryByMeeting = asyncHandler(async (req, res) => {
    try {
        const { meetingId } = req.params;
        const summary = await Summary.findOne({ meeting: meetingId });
        if (!summary) {
            return res.status(404).json(new ApiResponse('Summary not found', 404));
        }
        return res.status(200).json(new ApiResponse('Summary fetched successfully', 200, summary));
    } catch (error) {
        return new ApiError('Failed to fetch summary', 500, error);
    }
});

export { createSummary, getSummaryByMeeting };