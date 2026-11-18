
import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.RUSTFS_ENDPOINT;
const publicEndpoint = process.env.RUSTFS_PUBLIC_URL
  ? new URL(process.env.RUSTFS_PUBLIC_URL).origin
  : undefined;

const accessKeyId = process.env.RUSTFS_ACCESS_KEY;
const secretAccessKey = process.env.RUSTFS_SECRET_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error("RustFS environment variables are missing");
}

const credentials = {
  accessKeyId,
  secretAccessKey,
};

const region = process.env.RUSTFS_REGION || "us-east-1";

// Used for uploads and deletions inside Docker.
export const rustfsClient = new S3Client({
  region,
  endpoint,
  credentials,
  forcePathStyle: true,
});

// Used only for browser-accessible presigned URLs.
export const rustfsPublicClient = new S3Client({
  region,
  endpoint: publicEndpoint || endpoint,
  credentials,
  forcePathStyle: true,
});

export const RUSTFS_BUCKET =
  process.env.RUSTFS_BUCKET || "vismaya-media";
