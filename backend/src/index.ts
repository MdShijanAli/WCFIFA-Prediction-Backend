// backend/src/index.ts
// Only the CHANGED section shown — add the two highlighted lines to your existing file.

// ─── STEP 1: Import admin routes ─────────────────────────────────────────────
// Add this import alongside your other route imports:
//
//   import adminRoutes from './routes/admin.routes';

// ─── STEP 2: Register the route ──────────────────────────────────────────────
// Add this line after your existing app.use() route registrations:
//
//   app.use('/api/admin', adminRoutes);

// ─── Full updated index.ts for reference ─────────────────────────────────────

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { config } from "./config";

import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import matchRoutes from "./routes/match.routes";
import predictionRoutes from "./routes/prediction.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import adminRoutes from "./routes/admin.routes"; // ← NEW

const app = express();

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
});
app.use("/api/", limiter);

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many OTP requests",
});
app.use("/api/auth/resend-otp", otpLimiter);
app.use("/api/auth/forgot-password", otpLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes); // ← NEW

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

if (config.nodeEnv === "production") {
  const frontendDist = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  app.get("*", (_, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use("/", (_, res) => {
  res.send("Welcome to the NBWC Prediction API!");
});

app.listen(config.port, () => {
  console.log(
    `Server running on port http://localhost:${config.port} in ${config.nodeEnv} mode`,
  );
});

export default app;
