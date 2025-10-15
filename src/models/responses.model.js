import mongoose, { Schema } from "mongoose";

const responseSchema = new Schema(
  {
    meeting: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [
      {
        question: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        answerText: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Response = mongoose.model("Response", responseSchema);