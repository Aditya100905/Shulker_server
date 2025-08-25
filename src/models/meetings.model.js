import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
    {
        meetingId: {
            type: String,
            required: true,
            unique: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

export const Meeting = mongoose.model("Meeting", meetingSchema);
