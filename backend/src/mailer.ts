import nodemailer from "nodemailer";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getAmmachiResponse } from './gemini.js';

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Supabase Admin Client (using Service Role Key)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


// Email transporter config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// In-memory tracker for demo (optional)
const userResponses = new Map();

// Send email
app.post("/api/send-ammachi-mail", async (req, res) => {
  const { to, message, userId, frontendUrl } = req.body;

  // ✅ Check if user already responded (temporary memory check)
  if (userResponses.has(userId)) {
    return res.status(200).json({
      success: true,
      message: "User already responded – skipping email",
    });
  }

  // 👇 Check Supabase `users` table for latest `last_email_sent_at`
  const { data, error } = await supabase
    .from("users")
    .select("last_email_sent_at")
    .eq("id", userId)
    .maybeSingle()
    

  if (error) {
    console.error("Supabase fetch error:", error);
    return res.status(500).json({ success: false, error: "User lookup failed" });
  }

  const lastSeenTime = new Date(data?.last_email_sent_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenTime.getTime()) / 1000 / 60;

  if (diffMinutes < 3) {
    return res.status(200).json({
      success: true,
      message: `User was recently active (${Math.round(diffMinutes)} mins ago) – skipping email`,
    });
  }

  // Add tracking URL
  const trackingUrl = `${frontendUrl}/webcam`;
  const fullMessage = `${message}\n\nAre you ignoring Ammachi? Click here within 3 minutes: ${trackingUrl}`;

const fullMessageHTML = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff8f0; padding: 20px; border-radius: 8px; color: #333;">
    <h2 style="color: #e53935;">Ammachi is watching you! 👵</h2>
    <p style="font-size: 16px;">${message.replace(/\n/g, "<br>")}</p>
    
    <p style="margin-top: 20px; font-size: 16px;">Are you ignoring Ammachi?</p>
    
    <a href="${trackingUrl}" 
       style="
         display: inline-block;
         margin-top: 10px;
         padding: 12px 20px;
         background-color: #ff7043;
         color: white;
         text-decoration: none;
         border-radius: 5px;
         font-weight: bold;
         font-size: 16px;
       ">
      Click here within 3 minutes ⚠️
    </a>

    <p style="margin-top: 30px; font-size: 14px; color: #999;">This message was lovingly sent by Ammachi to keep you on track ❤️</p>
  </div>
`;

const mailOptions = {
  from: `"Ammachi 👵" <${process.env.EMAIL_USER}>`,
  to,
  subject: "⚠️ Ammachi is watching you!",
  text: fullMessage, // for plain-text email fallback
  html: fullMessageHTML,
};
  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Mail sent" });
  } catch (error) {
    console.error("Email send failed:", error);
    return res.status(500).json({ success: false, error: "Failed to send mail" });
  }
});

// 📩 User clicked the email tracking link
app.get("/api/track-response", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, error: "Missing userId" });
  }

  try {
    // ✅ Update `last_email_sent_at` in Supabase
    const { error } = await supabase
      .from("users")
      .update({ last_email_sent_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("Error updating last_email_sent_at:", error);
      return res.status(500).json({ success: false, error: "Failed to update last_email_sent_at" });
    }

    // ✅ Optional: set in-memory map for temporary lock
    userResponses.set(userId, true);

    return res.status(200).json({ success: true, message: "Response tracked" });
  } catch (err) {
    console.error("Tracking failed:", err);
    return res.status(500).json({ success: false, error: "Tracking failed" });
  }
});
app.post('/api/ammachi-chat', async (req, res) => {
  try {
    const { moodLevel, userInput, questionCount } = req.body;
    const response = await getAmmachiResponse(moodLevel, userInput, questionCount);
    res.json(response);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ response: "Ammachi is too emotional to respond right now", mood: null });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
