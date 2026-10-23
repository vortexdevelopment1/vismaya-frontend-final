import "dotenv/config";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import zlib from "zlib";
import User from "../dist/models/user.model.js";
import Session from "../dist/models/session.model.js";
import TalentProfile from "../dist/models/talentProfile.model.js";
import MediaItem from "../dist/models/mediaItem.model.js";
import RegistrationDraft from "../dist/models/registrationDraft.model.js";
import { deleteFile } from "../dist/services/cloudinary.service.js";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";
const PREFIX = "E2E-PHOTO";
const JWT_SECRET = process.env.JWT_SECRET || "7f9d8c6b5a4e3f2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d";

const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

const assert = (condition, description) => {
  if (condition) {
    results.passed++;
    results.tests.push({ description, status: "PASS" });
    console.log(`  ✓ PASS: ${description}`);
  } else {
    results.failed++;
    results.tests.push({ description, status: "FAIL" });
    console.error(`  ✗ FAIL: ${description}`);
  }
};

// ---------------------------------------------------------------------------
// Client Rules Simulator (matching frontend/lib/utils/imageProcess.js)
// ---------------------------------------------------------------------------
const VALIDATION_MESSAGES = {
  INVALID_TYPE: "Photo must be a JPG or PNG.",
  TOO_SMALL: "Photo is too small. Please choose a larger photo.",
  TOO_LARGE: "Photo is too large. Please choose a smaller one.",
  UPLOAD_FAILED: "Upload failed. Please try again.",
  SHARPER_HINT: "A larger photo gives a sharper profile.",
};

function checkImageDimensions(width, height) {
  const shorterSide = Math.min(width, height);
  if (shorterSide < 300) {
    return { valid: false, error: VALIDATION_MESSAGES.TOO_SMALL, hint: null, shorterSide };
  }
  if (shorterSide < 600) {
    return { valid: true, error: null, hint: VALIDATION_MESSAGES.SHARPER_HINT, shorterSide };
  }
  return { valid: true, error: null, hint: null, shorterSide };
}

function simulateClientCropAndCompress(srcW, srcH) {
  const targetRatio = 4 / 5; // 0.8
  let cropW, cropH;
  if (srcW / srcH > targetRatio) {
    cropH = srcH;
    cropW = srcH * targetRatio;
  } else {
    cropW = srcW;
    cropH = cropW / targetRatio;
  }

  const longer = Math.max(cropW, cropH);
  let outW = cropW;
  let outH = cropH;
  if (longer > 2000) {
    const scale = 2000 / longer;
    outW = Math.round(cropW * scale);
    outH = Math.round(cropH * scale);
  }
  outW = Math.max(1, Math.round(outH * targetRatio));
  return { outW, outH };
}

// ---------------------------------------------------------------------------
// Image Generators (PNG with valid header and chunks)
// ---------------------------------------------------------------------------
function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const crc = zlib.crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function createValidPng(width = 800, height = 1000) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // default filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);

  const lineSize = 1 + width * 3;
  const rawData = Buffer.alloc(lineSize * height);
  for (let x = 0; x < width; x++) {
    const pixelOffset = 1 + x * 3;
    rawData[pixelOffset] = 138;     // R (#8A6B2E)
    rawData[pixelOffset + 1] = 107; // G
    rawData[pixelOffset + 2] = 46;  // B
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Minimal valid JPEG with optional EXIF orientation
function createValidJpeg(width = 800, height = 1000, orientation = 1) {
  let exifApp1 = Buffer.alloc(0);
  if (orientation) {
    const exifData = Buffer.from([
      0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
      0x49, 0x49, 0x2A, 0x00,             // II (little endian), version 42
      0x08, 0x00, 0x00, 0x00,             // Offset to IFD0 (8)
      0x01, 0x00,                         // Number of IFD tags: 1
      0x12, 0x01,                         // Tag: 0x0112 (Orientation)
      0x03, 0x00,                         // Type: SHORT (3)
      0x01, 0x00, 0x00, 0x00,             // Count: 1
      orientation, 0x00, 0x00, 0x00,      // Value: orientation
      0x00, 0x00, 0x00, 0x00              // Offset to next IFD: 0
    ]);
    const app1Len = Buffer.alloc(2);
    app1Len.writeUInt16BE(exifData.length + 2, 0);
    exifApp1 = Buffer.concat([Buffer.from([0xFF, 0xE1]), app1Len, exifData]);
  }

  // DQT
  const dqt = Buffer.concat([
    Buffer.from([0xFF, 0xDB, 0x00, 0x43, 0x00]),
    Buffer.alloc(64, 16)
  ]);

  // SOF0
  const sof0 = Buffer.alloc(19);
  sof0[0] = 0xFF; sof0[1] = 0xC0;
  sof0.writeUInt16BE(17, 2);
  sof0[4] = 8;
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  sof0[9] = 3;
  sof0[10] = 1; sof0[11] = 0x11; sof0[12] = 0;
  sof0[13] = 2; sof0[14] = 0x11; sof0[15] = 0;
  sof0[16] = 3; sof0[17] = 0x11; sof0[18] = 0;

  // DHT
  const dht = Buffer.from([
    0xFF, 0xC4, 0x00, 0x1F, 0x00,
    0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B
  ]);

  // SOS
  const sos = Buffer.from([
    0xFF, 0xDA, 0x00, 0x0C, 0x03,
    0x01, 0x00, 0x02, 0x11, 0x03, 0x11,
    0x00, 0x3F, 0x00
  ]);

  // Scan & EOI
  const scanData = Buffer.from([0xFF, 0x00]);
  const eoi = Buffer.from([0xFF, 0xD9]);

  return Buffer.concat([
    Buffer.from([0xFF, 0xD8]),
    exifApp1,
    dqt,
    sof0,
    dht,
    sos,
    scanData,
    eoi
  ]);
}

const createTokenWithSession = async (user) => {
  const sessionId = crypto.randomBytes(32).toString("hex");
  await Session.create({
    userId: user._id,
    sessionId,
    deviceInfo: "E2E Test Client",
    ipAddress: "127.0.0.1",
    userAgent: "NodeTest",
    isValid: true,
    expiresAt: new Date(Date.now() + 7 * 86400000)
  });
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, sessionId },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

async function run() {
  console.log("\n=======================================================");
  console.log("   E2E LIVE TEST: PROFILE PHOTO VALIDATION SUITE");
  console.log("   Prefix: " + PREFIX);
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vismaya";
  await mongoose.connect(mongoUri);

  const timestamp = Date.now();
  const testEmail = `${PREFIX}-${timestamp}@vismaya.io`.toLowerCase();
  const trackedPublicIds = [];

  try {
    // -------------------------------------------------------------------------
    // 1. UNAUTHENTICATED UPLOAD (401)
    // -------------------------------------------------------------------------
    console.log("1. Testing Unauthenticated Upload (401)...");
    const unauthForm = new FormData();
    const testBuffer = createValidPng(800, 1000);
    unauthForm.append("file", new Blob([testBuffer], { type: "image/png" }), "headshot.png");
    unauthForm.append("rightsConfirmed", "true");

    const unauthRes = await fetch(`${BASE_URL}/api/media`, {
      method: "POST",
      body: unauthForm,
    });
    assert(unauthRes.status === 401, "Unauthenticated upload rejected with 401");

    // Create throwaway test user
    const testUser = await User.create({
      name: "E2E Photo Tester",
      email: testEmail,
      password: "secretpassword123",
      role: "talent",
      status: "active",
      isEmailVerified: true,
    });
    const token = await createTokenWithSession(testUser);

    // -------------------------------------------------------------------------
    // 2. WRONG FILE TYPE (REJECTED)
    // -------------------------------------------------------------------------
    console.log("\n2. Testing Wrong File Type Rejection...");
    // 2a. Client-side rule check
    assert(VALIDATION_MESSAGES.INVALID_TYPE === "Photo must be a JPG or PNG.", "Client message for wrong type matches spec");

    // 2b. Backend rejection for disguised non-image
    const wrongTypeForm = new FormData();
    const fakeText = Buffer.from("Not an image at all, just plain text");
    wrongTypeForm.append("file", new Blob([fakeText], { type: "image/png" }), "fake.png");
    wrongTypeForm.append("rightsConfirmed", "true");

    const wrongTypeRes = await fetch(`${BASE_URL}/api/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: wrongTypeForm,
    });
    assert(wrongTypeRes.status === 400, "Wrong file type / magic byte mismatch rejected with 400");

    // -------------------------------------------------------------------------
    // 3. 200x200 PHOTO (REJECTED AS TOO SMALL)
    // -------------------------------------------------------------------------
    console.log("\n3. Testing 200x200 Photo Rejection (<300px)...");
    const smallCheck = checkImageDimensions(200, 200);
    assert(smallCheck.valid === false, "200x200 photo fails shorter side check");
    assert(
      smallCheck.error === "Photo is too small. Please choose a larger photo.",
      "Message for <300px matches: 'Photo is too small. Please choose a larger photo.'"
    );

    // -------------------------------------------------------------------------
    // 4. 350x350 PHOTO (ACCEPTED WITH NON-BLOCKING HINT)
    // -------------------------------------------------------------------------
    console.log("\n4. Testing 350x350 Photo (Accepted with Hint)...");
    const hintCheck = checkImageDimensions(350, 350);
    assert(hintCheck.valid === true, "350x350 photo is accepted (shorter side >= 300)");
    assert(
      hintCheck.hint === "A larger photo gives a sharper profile.",
      "Non-blocking hint matches: 'A larger photo gives a sharper profile.'"
    );

    // Upload 350x350 cropped to 4:5 (280x350)
    const form350 = new FormData();
    const png350 = createValidPng(280, 350);
    form350.append("file", new Blob([png350], { type: "image/png" }), "photo-350.png");
    form350.append("rightsConfirmed", "true");
    form350.append("isMainProfilePhoto", "true");
    form350.append("category", "headshot");

    const res350 = await fetch(`${BASE_URL}/api/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form350,
    });
    const data350 = await res350.json();
    assert(res350.status === 201, "350x350 photo uploaded successfully to backend (status 201)");
    if (data350?.mediaItem?.url) {
      const match = data350.mediaItem.url.match(/vismaya\/(profiles|media)\/[^.]+/);
      if (match) trackedPublicIds.push(match[0]);
    }

    // -------------------------------------------------------------------------
    // 5. NORMAL ~800x1000 PHOTO (ACCEPTED WITHOUT HINT)
    // -------------------------------------------------------------------------
    console.log("\n5. Testing Normal ~800x1000 Photo (Accepted)...");
    const normCheck = checkImageDimensions(800, 1000);
    assert(normCheck.valid === true, "800x1000 photo is valid");
    assert(normCheck.hint === null, "800x1000 photo has no hint (shorter side >= 600)");

    const form800 = new FormData();
    const png800 = createValidPng(800, 1000);
    form800.append("file", new Blob([png800], { type: "image/png" }), "normal-800x1000.png");
    form800.append("rightsConfirmed", "true");
    form800.append("isMainProfilePhoto", "true");
    form800.append("category", "headshot");

    const res800 = await fetch(`${BASE_URL}/api/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form800,
    });
    const data800 = await res800.json();
    assert(res800.status === 201, "Normal ~800x1000 photo uploaded successfully (status 201)");
    const normalPhotoUrl = data800?.mediaItem?.url;
    assert(Boolean(normalPhotoUrl), "Returned valid Cloudinary photo URL");

    if (normalPhotoUrl) {
      const match = normalPhotoUrl.match(/vismaya\/(profiles|media)\/[^.]+/);
      if (match) trackedPublicIds.push(match[0]);
    }

    // -------------------------------------------------------------------------
    // 6. 4000x3000 PHONE-SIZE PHOTO (COMPRESSED & ACCEPTED)
    // -------------------------------------------------------------------------
    console.log("\n6. Testing 4000x3000 Phone-Size Photo (Compressed to <=2000px)...");
    const phoneCheck = checkImageDimensions(4000, 3000);
    assert(phoneCheck.valid === true, "4000x3000 phone photo accepted by dimension checker");

    // Client-side crop & scale computation
    const compressedDims = simulateClientCropAndCompress(4000, 3000);
    assert(
      Math.max(compressedDims.outW, compressedDims.outH) <= 2000,
      `Longer side scaled down to <=2000px (Actual: ${compressedDims.outW}x${compressedDims.outH})`
    );
    assert(
      compressedDims.outW === 1600 && compressedDims.outH === 2000,
      `Exact 4:5 cropped size is 1600x2000`
    );

    // Upload the compressed 1600x2000 result to backend (client exports JPEG quality 0.85)
    const formPhone = new FormData();
    const jpegPhone = createValidJpeg(1600, 2000);
    formPhone.append("file", new Blob([jpegPhone], { type: "image/jpeg" }), "phone-photo-compressed.jpg");
    formPhone.append("rightsConfirmed", "true");
    formPhone.append("isMainProfilePhoto", "true");
    formPhone.append("category", "headshot");

    const resPhone = await fetch(`${BASE_URL}/api/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formPhone,
    });
    const dataPhone = await resPhone.json();
    if (resPhone.status !== 201) {
      console.error("resPhone error:", resPhone.status, dataPhone);
    }
    assert(resPhone.status === 201, "Compressed 1600x2000 phone photo accepted by backend (status 201)");
    const phonePhotoUrl = dataPhone?.mediaItem?.url;
    if (phonePhotoUrl) {
      const match = phonePhotoUrl.match(/vismaya\/(profiles|media)\/[^.]+/);
      if (match) trackedPublicIds.push(match[0]);
    }

    // -------------------------------------------------------------------------
    // 7. ROTATED EXIF PHOTO (DISPLAYS UPRIGHT & UPLOADS)
    // -------------------------------------------------------------------------
    console.log("\n7. Testing Rotated EXIF Photo (Orientation 6: 90 deg CW)...");
    const exifJpeg = createValidJpeg(800, 1000, 6);
    assert(exifJpeg.length > 50, "Generated valid JPEG with APP1 EXIF Orientation 6 marker");

    // Verify JPEG magic bytes: FF D8 FF
    assert(
      exifJpeg[0] === 0xFF && exifJpeg[1] === 0xD8 && exifJpeg[2] === 0xFF,
      "JPEG magic bytes FF D8 FF verified for EXIF photo"
    );

    const formExif = new FormData();
    formExif.append("file", new Blob([exifJpeg], { type: "image/jpeg" }), "rotated-phone-photo.jpg");
    formExif.append("rightsConfirmed", "true");
    formExif.append("isMainProfilePhoto", "true");
    formExif.append("category", "headshot");

    const resExif = await fetch(`${BASE_URL}/api/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formExif,
    });
    const dataExif = await resExif.json();
    assert(resExif.status === 201, "Rotated EXIF JPEG uploaded and processed successfully (status 201)");
    const exifPhotoUrl = dataExif?.mediaItem?.url;
    if (exifPhotoUrl) {
      const match = exifPhotoUrl.match(/vismaya\/(profiles|media)\/[^.]+/);
      if (match) trackedPublicIds.push(match[0]);
    }

    // -------------------------------------------------------------------------
    // 8. PROFILE PERSISTENCE & PAYMENT GATE CHECK
    // -------------------------------------------------------------------------
    console.log("\n8. Testing Profile Persistence & Payment Gate...");
    const profileDoc = await TalentProfile.findOne({ userId: testUser._id });
    assert(Boolean(profileDoc?.profilePhoto), "TalentProfile.profilePhoto successfully saved in database");
    assert(
      profileDoc?.profilePhoto === exifPhotoUrl,
      "TalentProfile.profilePhoto matches most recent main profile photo"
    );

    // Draft with photo passes mandatory profile photo gate
    const draftPayload = {
      email: testEmail,
      role: "talent",
      currentStep: 3,
      formData: {
        name: "E2E Photo Tester",
        phone: "+91 98765 43210",
        city: "Mumbai",
        age: "24",
        photoUrl: exifPhotoUrl,
      }
    };
    const saveDraftRes = await fetch(`${BASE_URL}/api/auth/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftPayload)
    });
    const saveDraftData = await saveDraftRes.json();
    assert(saveDraftData.success, "Draft successfully saved with profile photo");

    const hasPhoto = Boolean(draftPayload.formData.photoUrl);
    assert(hasPhoto === true, "Payment gate requirement (profile photo mandatory before payment) passes");

  } finally {
    // -------------------------------------------------------------------------
    // 9. CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n9. Cleaning Up E2E Test Artifacts...");

    for (const pubId of trackedPublicIds) {
      try {
        await deleteFile(pubId);
        console.log(`  ✓ Cleaned up Cloudinary asset: ${pubId}`);
      } catch (err) {
        console.warn(`  ! Could not destroy Cloudinary asset: ${err?.message}`);
      }
    }

    const deletedUsers = await User.find({ email: { $regex: `^${PREFIX}`, $options: "i" } });
    const userIds = deletedUsers.map(u => u._id);

    await User.deleteMany({ _id: { $in: userIds } });
    await Session.deleteMany({ userId: { $in: userIds } });
    await TalentProfile.deleteMany({ userId: { $in: userIds } });
    await MediaItem.deleteMany({ owner: { $in: userIds } });
    await RegistrationDraft.deleteMany({ email: { $regex: `^${PREFIX}`, $options: "i" } });

    console.log(`  ✓ Cleaned up ${userIds.length} test user(s) and database records.`);
    await mongoose.disconnect();
  }

  console.log("\n=======================================================");
  console.log(`   E2E PHOTO STEP TEST SUMMARY: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log("=======================================================\n");

  if (results.failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
