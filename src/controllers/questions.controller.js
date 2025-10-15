import { Question } from "../models/questions.model.js";
import { Meeting } from "../models/meetings.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addQuestionsToMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { questions } = req.body; 
  const userId = req.user._id;

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) throw new ApiError("Meeting not found", 404);

  if (String(meeting.createdBy) !== String(userId))
    throw new ApiError("Only the meeting creator can add questions", 403);

  if (meeting.status !== "ended")
    throw new ApiError("You can only add questions after meeting ends", 400);

  if (!questions || !Array.isArray(questions) || questions.length === 0)
    throw new ApiError("Questions array is required", 400);

  const newQuestions = await Question.insertMany(
    questions.map((q) => ({
      meeting: meeting._id,
      questionText: q.questionText,
      options: q.options || [],
      correctAnswer: q.correctAnswer || null,
    }))
  );

  res.json(new ApiResponse("Questions added successfully", 201, newQuestions));
});

const getMeetingQuestions = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) throw new ApiError("Meeting not found", 404);

  const questions = await Question.find({ meeting: meeting._id });
  res.json(new ApiResponse("Questions fetched successfully", 200, questions));
});

export { addQuestionsToMeeting, getMeetingQuestions };
