import multer from "multer";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp";
import mime from "mime-types";

export const uploadWithDestination = (method, fields, uploadPath) => {
  const storage = multer.diskStorage({
    destination: uploadPath,
    filename: function (req, file, cb) {
      let ext = path.extname(file.originalname).toLowerCase();
      let mimeType = mime.lookup(file.originalname);
      
      const originalName = path.basename(file.originalname, path.extname(file.originalname));
      if(mimeType.startsWith("image/")){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, originalName + uniqueSuffix + ".webp");
      }
      else{
        var num = "";
        while(fs.existsSync(path.join(uploadPath,originalName +num+ ext))){
          num = num + 1;
        }
        cb(null, originalName +num+ ext);}
    },
  });
  const upload = multer({ storage }).fields(fields);
  return async (req, res, next) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        cleanupUploadedFiles(req.files);
        console.error("Erorr in multer",err);
        return res.status(400).send("Error uploading files: " + err.message);
      } else if (err) {
        cleanupUploadedFiles(req.files);
        console.error("Error uploading files:", err);
        return res.status(500).send("Error uploading files: " + err.message);
      }
      try {
        const response = await processFiles(req.files);
        next();
      } catch (processErr) {
        cleanupUploadedFiles(req.files);
        console.error("Error processing files:", processErr);
        return res
          .status(500)
          .send("Error processing files: " + processErr.message);
      }
    });
  };
};

const processFiles = async (files) => {
  const tempRemovingFiles = [];
  const processFile = async (file) => {
    let mimeType = mime.lookup(file.originalname);
    let ext = path.extname(file.originalname).toLowerCase();
    if (mimeType.startsWith("application/")) {
      return;
    }
    const originalPath = file.path.replace(/\\/g, "/");
    const compressedPath = path.join(path.dirname(originalPath), "temp" + ext);
    await fs.rename(originalPath, compressedPath);
    if (mimeType.startsWith("image/") && ext !== ".pdf") {
      let transformer = sharp(compressedPath);
      try {
        const response=transformer.webp({ quality: 75 })
        await response.toFile(originalPath);
        tempRemovingFiles.push(compressedPath);
      } catch (error) {
        console.log("Error:", error);
        fs.renameSync(compressedPath, originalPath);
      }
    } else {
      tempRemovingFiles.push(compressedPath);
    }
  };
  for (const fieldName in files) {
    const fileArray = files[fieldName];
    for (const file of fileArray) {
      await processFile(file);
    }
  }
  return tempRemovingFiles;
};

const cleanupTempFiles = (files) => {
  for (const tempFile of files) {
    if (fs.existsSync(tempFile)) {
      fs.unlink(tempFile, (err) => {
      });
    }
  }
};
const cleanupUploadedFiles = (files) => {
  if (files && Array.isArray(files)) {
    files.forEach((file) => {
      if (file && file.path) {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        });
      }
    });
  }
};
