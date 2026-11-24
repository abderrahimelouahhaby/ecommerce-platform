import multer from "multer";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Reads ONE file in the field "image", and keeps it in memory (never on disk).
// More than 2 MB, more than one file, or too many fields are refused.
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 20 },
}).single("image");
