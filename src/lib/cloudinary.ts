import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

function assertConfigured() {
  const missing = (["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const)
    .filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Cloudinary not configured — set ${missing.join(", ")} in .env.local`);
  }
}

assertConfigured();

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
