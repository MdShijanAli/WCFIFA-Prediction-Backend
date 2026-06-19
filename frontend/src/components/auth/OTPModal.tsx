import React, { useState, useRef, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';

interface OTPModalProps {
  userId: string;
  type: string;
  onSuccess?: (token?: string, user?: any) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function OTPModal({ userId, type, onSuccess, onClose, title, subtitle }: OTPModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste handling
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      inputs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyPhone(userId, code);
      toast.success('Verified successfully!');
      onSuccess?.(res.data.token, res.data.user);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendOTP(userId, type);
      setCountdown(60);
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="text-xl font-bold text-white">{title || 'Verify Phone'}</h3>
          <p className="text-gray-400 text-sm mt-2">
            {subtitle || 'Enter the 6-digit code sent to your phone'}
          </p>
        </div>

        <div className="flex gap-3 justify-center mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="btn-primary w-full"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <div className="text-center mt-4">
          {countdown > 0 ? (
            <p className="text-gray-500 text-sm">Resend code in {countdown}s</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
