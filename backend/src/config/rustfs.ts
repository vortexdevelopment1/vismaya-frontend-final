
import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.RUSTFS_ENDPOINT;
const accessKeyId = process.env.RUSTFS_ACCESS_KEY;
const secretAccessKey = process.env.RUSTFS_SECRET_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error("RustFS environment variables are missing");
}

export const rustfsClient = new S3Client({
  region: process.env.RUSTFS_REGION || "us-east-1",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export const RUSTFS_BUCKET =
  process.env.RUSTFS_BUCKET || "vismaya-media";
