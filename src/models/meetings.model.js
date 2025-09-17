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
        invitedParticipants: [
            {
                type: String,
            },
        ],
        scheduledTime: {
            type: Date,
            required: false,
        },
        status: {
            type: String,
            enum: ["scheduled", "ongoing", "ended"],
            default: "scheduled",
        },
        endedAt: {
            type: Date,
        },
        endedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export const Meeting = mongoose.model("Meeting", meetingSchema);
