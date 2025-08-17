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
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, originalName + "-" + uniqueSuffix + ext);
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
        await processFiles(req.files);
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
  const processFile = async (file) => {
    let mimeType = mime.lookup(file.originalname);
    let ext = path.extname(file.originalname).toLowerCase();

    if (mimeType && mimeType.startsWith("image/") && ext !== ".pdf") {
      const originalPath = file.path.replace(/\\/g, "/");
      const webpPath = originalPath.replace(ext, ".webp");

      try {
        await sharp(originalPath).webp({ quality: 75 }).toFile(webpPath);

        // remove original (jpeg/png/etc)
        await fs.remove(originalPath);

        // update file object to point to new webp
        file.path = webpPath;
        file.filename = path.basename(webpPath);
      } catch (error) {
        console.error("Sharp error:", error);
      }
    }
  };

  for (const fieldName in files) {
    const fileArray = files[fieldName];
    for (const file of fileArray) {
      await processFile(file);
    }
  }
};

const cleanupUploadedFiles = (files) => {
  if (files) {
    for (const fieldName in files) {
      files[fieldName].forEach((file) => {
        if (file && file.path && fs.existsSync(file.path)) {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting file:", unlinkErr);
            }
          });
        }
      });
    }
  }
};
