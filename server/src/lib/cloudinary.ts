import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadedImage = {
  url: string;
  publicId: string;
};

// Sends an image to Cloudinary. We keep the address (url) and the id (publicId).
export function uploadProductImage(buffer: Buffer): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce/products",
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],
        // Big images are scaled down: at most 1200 x 1200 pixels.
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary returned no result"));
          return;
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(buffer);
  });
}

export async function deleteProductImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
