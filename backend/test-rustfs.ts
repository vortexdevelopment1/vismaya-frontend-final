import { rustfsClient, RUSTFS_BUCKET } from "./src/config/rustfs.js";
import { HeadBucketCommand } from "@aws-sdk/client-s3";

async function testRustFS() {
  try {
    await rustfsClient.send(
      new HeadBucketCommand({
        Bucket: RUSTFS_BUCKET,
      })
    );

    console.log("RustFS connection successful!");
    console.log("Bucket:", RUSTFS_BUCKET);
  } catch (error) {
    console.error("RustFS connection failed:", error);
  }
}

testRustFS();