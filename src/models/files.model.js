import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
    {
        meeting: {
            type: Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
        },
        filename: {
            type: String,
            required: true,
        },
        filepath: {
            type: String,
            required: true,
        },
        mimetype: {
            type: String,
        },
        size: {
            type: Number,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        }
    },
    { timestamps: true }
);

export const File = mongoose.model("File", fileSchema);
