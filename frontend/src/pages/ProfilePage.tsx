import React, { useState } from "react";
import { Phone, Mail, CheckCircle, Shield, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { authApi, paymentApi } from "../services/api";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  const loadPayment = async () => {
    try {
      const res = await paymentApi.getStatus();
      setPaymentStatus(res.data.payment);
    } catch {}
  };

  React.useEffect(() => {
    loadPayment();
  }, []);

  const sendEmailOTP = async () => {
    if (!user?.email) {
      toast.error("No email on file");
      return;
    }
    try {
      await authApi.resendOTP(user.id, "EMAIL_VERIFY");
      setEmailOtpSent(true);
      toast.success("OTP sent to your email");
    } catch {
      toast.error("Failed to send OTP");
    }
  };

  const verifyEmail = async () => {
    if (emailOtp.length !== 6) return;
    setVerifyingEmail(true);
    try {
      await authApi.verifyEmail(emailOtp);
      updateUser({ isEmailVerified: true });
      setEmailOtpSent(false);
      toast.success("Email verified!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const genderLabel = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold ">Profile</h1>

      {/* Profile card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#F5C518] flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold ">{user?.name}</h2>
            <p className="text-gray-400">
              {user?.gender ? genderLabel[user.gender] : ""}
            </p>
            {user?.dob && (
              <p className="text-gray-500 text-sm">
                {new Date(user.dob).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Phone */}
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className=" font-medium">{user?.phone}</p>
                <p className="text-gray-500 text-xs">Phone Number</p>
              </div>
            </div>
            {user?.isPhoneVerified ? (
              <span className="flex items-center gap-1.5 text-[#F5C518] text-sm">
                <CheckCircle className="w-4 h-4" /> Verified
              </span>
            ) : (
              <span className="text-yellow-500 text-sm">Not Verified</span>
            )}
          </div>

          {/* Email */}
          <div className="p-4 border rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className=" font-medium">
                    {user?.email || "Not provided"}
                  </p>
                  <p className="text-gray-500 text-xs">Email Address</p>
                </div>
              </div>
              {user?.email &&
                (user?.isEmailVerified ? (
                  <span className="flex items-center gap-1.5 text-[#F5C518] text-sm">
                    <CheckCircle className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <button
                    onClick={sendEmailOTP}
                    className="text-[#F5C518] hover:text-[#F5C518]/80 text-sm"
                  >
                    Verify Email
                  </button>
                ))}
            </div>
            {emailOtpSent && user?.email && !user?.isEmailVerified && (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={emailOtp}
                  onChange={(e) =>
                    setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="input-field flex-1 py-2"
                />
                <button
                  onClick={verifyEmail}
                  disabled={verifyingEmail || emailOtp.length !== 6}
                  className="btn-primary py-2"
                >
                  {verifyingEmail ? "..." : "Verify"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment status */}
      {/* <div className="card">
        <h3 className="font-bold  mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#F5C518]" />
          Payment Status
        </h3>
        {paymentStatus ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <span className="text-gray-400">Status</span>
              <span className={`font-semibold ${paymentStatus.status === 'COMPLETED' ? 'text-[#F5C518]' :
                paymentStatus.status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                {paymentStatus.status}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <span className="text-gray-400">Amount</span>
              <span className=" font-semibold">৳{paymentStatus.amount}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-xl">
              <span className="text-gray-400">Transaction ID</span>
              <span className=" font-mono text-sm">{paymentStatus.transactionId}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">No payment found</p>
          </div>
        )}
      </div> */}

      {/* Security */}
      <div className="card">
        <h3 className="font-bold  mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#F5C518]" />
          Security
        </h3>
        <div className="flex items-center justify-between p-4 border rounded-xl">
          <span className="text-gray-300">Password</span>
          <button
            onClick={() => (window.location.href = "/forgot-password")}
            className="text-[#F5C518] hover:text-[#F5C518]/80 text-sm"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
