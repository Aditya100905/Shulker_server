import express from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { deleteFile, getMeetingFiles, getSingleFile, uploadFile } from "../controllers/files.controller.js";
import { validateJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/meetings/:meetingId/files", validateJWT, upload.single("file"), uploadFile);
router.get("/meetings/:meetingId/files", validateJWT, getMeetingFiles);
router.get("/files/:fileId", validateJWT, getSingleFile);
router.delete("/files/:fileId", validateJWT, deleteFile);

export default router;