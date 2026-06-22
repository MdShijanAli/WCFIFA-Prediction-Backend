import { randomInt } from "crypto";
import { config } from "../config";
import { prisma } from "../lib/prisma";

// In dev mode, log OTP to console instead of sending
const isDev = config.nodeEnv === "development";

export const generateOTP = (): string => {
  return randomInt(100000, 999999).toString();
};

export const createOTP = async (
  userId: string,
  type: string,
  target: string,
): Promise<string> => {
  // Invalidate previous OTPs of same type
  await prisma.oTP.updateMany({
    where: { userId, type, used: false },
    data: { used: true },
  });

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.oTP.create({
    data: { userId, code, type, target, expiresAt },
  });

  return code;
};

export const verifyOTP = async (
  userId: string,
  code: string,
  type: string,
): Promise<boolean> => {
  const otp = await prisma.oTP.findFirst({
    where: {
      userId,
      code,
      type,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) return false;

  await prisma.oTP.update({ where: { id: otp.id }, data: { used: true } });
  return true;
};

export const sendSMSOTP = async (
  phone: string,
  code: string,
): Promise<void> => {
  if (isDev || !config.twilio.accountSid?.startsWith("AC")) {
    console.log(`[OTP] SMS to ${phone}: ${code}`);
    return;
  }

  const twilio = require("twilio")(
    config.twilio.accountSid,
    config.twilio.authToken,
  );
  await twilio.messages.create({
    body: `Your NBWC Prediction verification code is: ${code}. Valid for 10 minutes.`,
    from: config.twilio.phoneNumber,
    to: phone,
  });
};

export const sendEmailOTP = async (
  email: string,
  code: string,
  type: string,
): Promise<void> => {
  if (isDev || !config.smtp.host) {
    console.log(`[OTP] Email to ${email}: ${code}`);
    return;
  }

  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });

  const subjects: Record<string, string> = {
    EMAIL_VERIFY: "Verify your email - NBWC Prediction",
    FORGOT_PASSWORD: "Reset your password - NBWC Prediction",
  };

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: subjects[type] || "NBWC Prediction OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a472a;">NBWC Prediction Competition</h2>
        <p>Your verification code is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px;">
          <h1 style="color: #1a472a; letter-spacing: 8px;">${code}</h1>
        </div>
        <p>This code is valid for 10 minutes.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};
