import fse from "fs-extra";

export const deleteFile = (filePath) => {
  if (fse.existsSync(filePath)) {
    fse.unlinkSync(filePath);
  }
};
