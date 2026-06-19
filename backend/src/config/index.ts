import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  registrationFee: parseFloat(process.env.REGISTRATION_FEE || '500'),

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.FROM_EMAIL || 'noreply@nbwcprediction.com',
  },

  sslcz: {
    storeId: process.env.SSLCZ_STORE_ID || '',
    storePassword: process.env.SSLCZ_STORE_PASSWD || '',
    isLive: process.env.SSLCZ_IS_LIVE === 'true',
  },
};

export const ROUND_POINTS: Record<string, number> = {
  ROUND_OF_32: 2,
  ROUND_OF_16: 4,
  ROUND_OF_8: 6,
  QUARTER_FINAL: 8,
  SEMI_FINAL: 10,
  FINAL: 20,
};
