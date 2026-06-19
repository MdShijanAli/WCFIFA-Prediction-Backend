import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Trophy, Phone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import OTPModal from '../components/auth/OTPModal';

interface LoginForm {
  phone: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpState, setOtpState] = useState<{ show: boolean; userId: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.phone, data.password);
      if (res.data.requiresVerification) {
        setOtpState({ show: true, userId: res.data.userId });
        toast('Please verify your phone number', { icon: '📱' });
      } else {
        login(res.data.token, res.data.user);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = (token: string, user: any) => {
    login(token, user);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-primary-900 to-gray-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-6xl" style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              transform: 'rotate(45deg)', opacity: 0.3
            }}>⚽</div>
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Trophy className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">NBWC Prediction</h1>
          <p className="text-primary-300 text-lg max-w-sm">
            Predict FIFA World Cup Qualifying matches and compete with players nationwide!
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[
              { label: 'Round of 32', points: '2 pts' },
              { label: 'Semi Final', points: '10 pts' },
              { label: 'Final', points: '20 pts' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-2xl p-4">
                <div className="text-yellow-400 font-bold text-xl">{item.points}</div>
                <div className="text-gray-300 text-xs mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl">NBWC Prediction</h1>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  {...register('phone', { required: 'Phone number is required' })}
                  type="tel"
                  placeholder="+880XXXXXXXXXX"
                  className="input-field pl-12"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300 text-sm">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {otpState && (
        <OTPModal
          userId={otpState.userId}
          type="PHONE_VERIFY"
          onSuccess={handleOTPVerified}
          onClose={() => setOtpState(null)}
        />
      )}
    </div>
  );
}
