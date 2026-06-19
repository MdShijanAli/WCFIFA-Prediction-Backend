# Deploying to Railway

## Steps

1. Go to https://railway.app and create a new project
2. Click **Deploy from GitHub repo** → select `naimulbaset/nbwcprediction`
3. Railway will auto-detect the `railway.toml` config

### Add PostgreSQL
- In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**
- Railway will auto-inject `DATABASE_URL` into your service

### Set Environment Variables
In your Railway service → **Variables**, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (generate a strong random string) |
| `JWT_EXPIRES_IN` | `7d` |
| `REGISTRATION_FEE` | `500` |
| `FRONTEND_URL` | `https://your-app.up.railway.app` (your Railway URL) |
| `TWILIO_ACCOUNT_SID` | (from Twilio, optional) |
| `TWILIO_AUTH_TOKEN` | (from Twilio, optional) |
| `TWILIO_PHONE_NUMBER` | (from Twilio, optional) |
| `SMTP_HOST` | (your SMTP host, optional) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (your email) |
| `SMTP_PASS` | (your app password) |
| `FROM_EMAIL` | `noreply@yourdomain.com` |
| `SSLCZ_STORE_ID` | (from SSLCommerz) |
| `SSLCZ_STORE_PASSWD` | (from SSLCommerz) |
| `SSLCZ_IS_LIVE` | `false` (test) or `true` (production) |

### After first deploy
Run the seed script once to populate teams and initial matches:
```
railway run cd backend && npx ts-node prisma/seed.ts
```
Or use the Railway shell in the dashboard.

## Notes
- `DATABASE_URL` is automatically set by the Railway PostgreSQL plugin
- OTPs are logged to console in dev mode; Twilio SMS is used in production
- Payment uses demo mode until SSLCommerz credentials are set
