import { File } from "../models/files.model.js";
import { Meeting } from "../models/meetings.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

export const uploadFile = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    if (!req.file) throw new ApiError("No file uploaded", 400);

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new ApiError("Meeting not found", 404);

    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: "meeting-files",
            resource_type: "auto",
        },
        async (error, result) => {
            if (error) {
                console.error("Cloudinary upload error:", error);
                throw new ApiError("File upload failed", 500);
            }

            const fileDoc = await File.create({
                meeting: meeting._id,
                filename: req.file.originalname,
                filepath: result.secure_url,
                mimetype: req.file.mimetype,
                size: req.file.size,
                uploadedBy: userId,
            });

            res.json(new ApiResponse("File uploaded successfully", 201, fileDoc));
        }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

export const getMeetingFiles = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) throw new ApiError("Meeting not found", 404);

    const files = await File.find({ meeting: meeting._id })
        .populate("uploadedBy", "username email");

    res.json(new ApiResponse("Files fetched successfully", 200, files));
});

export const getSingleFile = asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    const file = await File.findById(fileId).populate("uploadedBy", "username email");
    if (!file) throw new ApiError("File not found", 404);

    res.json(new ApiResponse("File fetched successfully", 200, file));
});

export const deleteFile = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const userId = req.user._id;

    const file = await File.findById(fileId);
    if (!file) throw new ApiError("File not found", 404);

    if (file.uploadedBy.toString() !== userId.toString()) {
        throw new ApiError("Not authorized to delete this file", 403);
    }

    const publicId = file.filepath.split("/").slice(-1)[0].split(".")[0];
    await cloudinary.uploader.destroy(`meeting-files/${publicId}`, {
        resource_type: "auto",
    });

    await file.deleteOne();

    res.json(new ApiResponse("File deleted successfully", 200, {}));
});
