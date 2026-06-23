import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Phone, Lock, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';

type Step = 'phone' | 'otp' | 'password' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('phone');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm<{ phone: string }>();
  const otpForm = useForm<{ code: string }>();
  const [otpCode, setOtpCode] = useState('');
  const passwordForm = useForm<{ newPassword: string; confirmPassword: string }>();
  const newPassword = passwordForm.watch('newPassword');

  const handlePhone = async (data: { phone: string }) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(data.phone);
      setUserId(res.data.userId || '');
      setStep('otp');
      toast.success('OTP sent to your phone');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setStep('password');
  };

  const handlePassword = async (data: { newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(userId, otpCode, data.newPassword);
      setStep('done');
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white font-bold text-xl">inal Whistle 2026 Prediction</h1>
        </div>

        <div className="card">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['Phone', 'OTP', 'Password'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${['phone', 'otp', 'password', 'done'].indexOf(step) >= i
                    ? 'text-primary-400' : 'text-gray-600'
                  }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${['phone', 'otp', 'password', 'done'].indexOf(step) >= i
                      ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-600'
                    }`}>{i + 1}</div>
                  {s}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-800" />}
              </React.Fragment>
            ))}
          </div>

          {step === 'phone' && (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Forgot Password</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your registered phone number</p>
              <form onSubmit={phoneForm.handleSubmit(handlePhone)} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    {...phoneForm.register('phone', { required: true })}
                    type="tel" placeholder="+880XXXXXXXXXX" className="input-field pl-12"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Enter OTP</h2>
              <p className="text-gray-400 text-sm mb-6">Enter the 6-digit code sent to your phone</p>
              <div className="flex gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpCode[i] || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      const arr = otpCode.split('');
                      arr[i] = val;
                      setOtpCode(arr.join('').slice(0, 6));
                      if (val && i < 5) {
                        const next = document.querySelector(`[data-otp="${i + 1}"]`) as HTMLInputElement;
                        next?.focus();
                      }
                    }}
                    data-otp={i}
                    className="w-11 h-12 text-center text-lg font-bold bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:border-primary-500"
                  />
                ))}
              </div>
              <button onClick={handleOTP} className="btn-primary w-full">Next</button>
            </>
          )}

          {step === 'password' && (
            <>
              <h2 className="text-xl font-bold text-white mb-2">New Password</h2>
              <p className="text-gray-400 text-sm mb-6">Choose a strong new password</p>
              <form onSubmit={passwordForm.handleSubmit(handlePassword)} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    {...passwordForm.register('newPassword', { required: true, minLength: 8 })}
                    type="password" placeholder="New password (min. 8 chars)" className="input-field pl-12"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    {...passwordForm.register('confirmPassword', {
                      validate: v => v === newPassword || 'Passwords do not match'
                    })}
                    type="password" placeholder="Confirm new password" className="input-field pl-12"
                  />
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-red-400 text-xs">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
              <p className="text-gray-400 text-sm mb-6">Your password has been updated successfully.</p>
              <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
            </div>
          )}

          {step !== 'done' && (
            <p className="text-center text-gray-500 text-sm mt-4">
              <Link to="/login" className="text-primary-400 hover:text-primary-300">← Back to Login</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
