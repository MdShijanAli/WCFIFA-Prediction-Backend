import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  register: (data: any) => api.post("/auth/register", data),
  login: (phone: string, password: string) =>
    api.post("/auth/login", { phone, password }),
  verifyPhone: (userId: string, code: string) =>
    api.post("/auth/verify-phone", { userId, code }),
  resendOTP: (userId: string, type: string) =>
    api.post("/auth/resend-otp", { userId, type }),
  forgotPassword: (phone: string) =>
    api.post("/auth/forgot-password", { phone }),
  resetPassword: (userId: string, code: string, newPassword: string) =>
    api.post("/auth/reset-password", { userId, code, newPassword }),
  verifyEmail: (code: string) => api.post("/auth/verify-email", { code }),
  getProfile: () => api.get("/auth/profile"),
};

export const paymentApi = {
  initiate: () => api.post("/payments/initiate"),
  confirmDemo: (transactionId: string) =>
    api.post("/payments/confirm-demo", { transactionId }),
  getStatus: () => api.get("/payments/status"),
};

export const matchApi = {
  getAll: (params?: any) => api.get("/matches", { params }),
  getById: (id: string) => api.get(`/matches/${id}`),
};

export const upcomingMatchesApi = {
  getAll: () => api.get("/matches/upcoming"),
};

export const predictionApi = {
  submit: (matchId: string, predictedWinnerId: string) =>
    api.post("/predictions", { matchId, predictedWinnerId }),
  submitBulk: (
    predictions: Array<{ matchId: string; predictedWinnerId: string }>,
  ) => api.post("/predictions/bulk", { predictions }),
  getMyPredictions: (round?: string) =>
    api.get("/predictions", { params: { round } }),
};

export const leaderboardApi = {
  getAll: (page?: number) => api.get("/leaderboard", { params: { page } }),
  getMyRank: () => api.get("/leaderboard/my-rank"),
  getTop: () => api.get("/leaderboard/top"),
};

export const sponsorVideoApi = {
  getCurrent: () => api.get("/sponsor-video/current"),
  start: () => api.post("/sponsor-video/start"),
  complete: (sessionId: string) =>
    api.post("/sponsor-video/complete", { watchSessionId: sessionId }),
};

export default api;
