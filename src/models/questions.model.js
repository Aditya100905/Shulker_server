import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema(
  {
    meeting: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: [String], 
    correctAnswer: {
      type: String, 
      trim: true,
    },
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);
