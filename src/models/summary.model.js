import mongoose, { Schema } from "mongoose";

const summarySchema = new Schema(
  {
    meeting: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    actionItems: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

export const Summary = mongoose.model("Summary", summarySchema);
