import { Summary } from "../models/summary.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createSummary = asyncHandler(async (req, res) => {
    const { meetingId, content, actionItems } = req.body;
    const existingSummary = await Summary.findOne({ meeting: meetingId });
    if (existingSummary) {
        throw new ApiError('Summary already exists for this meeting', 400);
    }
    const summary = new Summary({
        meeting: meetingId,
        content,
        actionItems,
    });
    await summary.save();
    res.status(201).json(new ApiResponse('Summary created successfully', 201, summary));
});

const getSummaryByMeeting = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const summary = await Summary.findOne({ meeting: meetingId });
    if (!summary) {
        throw new ApiError('Summary not found', 404);
    }
    res.status(200).json(new ApiResponse('Summary fetched successfully', 200, summary));
});

export { createSummary, getSummaryByMeeting };
