import { Response } from "../models/responses.model.js";
import { Question } from "../models/questions.model.js";
import { Meeting } from "../models/meetings.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const submitResponses = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { answers } = req.body; 
  const userId = req.user._id;

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) throw new ApiError("Meeting not found", 404);

  if (!answers || !Array.isArray(answers) || answers.length === 0)
    throw new ApiError("Answers array is required", 400);

  const existingResponse = await Response.findOne({
    meeting: meeting._id,
    user: userId,
  });
  if (existingResponse)
    throw new ApiError("You have already submitted responses for this meeting", 400);

  const responseData = await Promise.all(
    answers.map(async (a) => {
      const question = await Question.findById(a.questionId);
      if (!question) throw new ApiError(`Question not found: ${a.questionId}`, 404);

      return {
        question: question._id,
        answerText: a.answerText,
        isCorrect:
          question.correctAnswer &&
          a.answerText.trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase(),
      };
    })
  );

  const newResponse = await Response.create({
    meeting: meeting._id,
    user: userId,
    answers: responseData,
  });

  res.json(new ApiResponse("Responses submitted successfully", 201, newResponse));
});

const getMeetingResponses = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) throw new ApiError("Meeting not found", 404);

  const responses = await Response.find({ meeting: meeting._id })
    .populate("user", "username email")
    .populate("answers.question", "questionText options correctAnswer");

  res.json(new ApiResponse("Responses fetched successfully", 200, responses));
});

export { submitResponses, getMeetingResponses };
