
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  rustfsClient,
  rustfsPublicClient,
  RUSTFS_BUCKET,
} from "../config/rustfs.js";
import { randomUUID } from "crypto";
import path from "path";

interface UploadOptions {
  folder?: string;
  contentType: string;
}

export const uploadToRustFS = async (
  file: Express.Multer.File,
  options: UploadOptions
) => {
  if (!file.buffer) {
    throw new Error("File buffer is missing");
  }

  const extension = path.extname(file.originalname);
  const key = `${options.folder || "uploads"}/${randomUUID()}${extension}`;

  await rustfsClient.send(
    new PutObjectCommand({
      Bucket: RUSTFS_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: options.contentType,
    })
  );

  return {
    key,
    fileSize: file.size,
    contentType: options.contentType,
    originalFilename: file.originalname,
  };
};

export const getRustFSPresignedUrl = async (key: string) => {
  return getSignedUrl(
    rustfsPublicClient,
    new GetObjectCommand({
      Bucket: RUSTFS_BUCKET,
      Key: key,
    }),
    { expiresIn: 3600 }
  );
};

export const deleteFromRustFS = async (key: string) => {
  await rustfsClient.send(
    new DeleteObjectCommand({
      Bucket: RUSTFS_BUCKET,
      Key: key,
    })
  );
};
