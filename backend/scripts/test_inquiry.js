import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

import mongoose from "mongoose";
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { submitContactInquiry } from "../dist/controllers/public.controller.js";

async function testSubmitInquiry() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to Mongo.");

  const req = {
    body: {
      name: "Prachi Rohit (Test)",
      email: "er.prachirohit@gmail.com",
      subject: "Test Live Inquiry with Email Alert",
      message: "Hello team, testing whether email arrives at vortexcubesdevelopment@gmail.com and admin notifications.",
    },
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    headers: { "user-agent": "Vismaya-Test-Agent/1.0" }
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log("Response JSON:", JSON.stringify(data, null, 2));
      return this;
    }
  };

  const next = (err) => {
    console.error("Next called with error:", err);
  };

  await submitContactInquiry(req, res, next);
  await mongoose.disconnect();
}

testSubmitInquiry();
