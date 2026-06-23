import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Phone, Lock, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import OTPModal from '../components/auth/OTPModal';

interface LoginForm {
  phone: string;
  password: string;
}

// World Cup 2026 top contenders — flag images from flagcdn.com
export const wcTeams = [
  { name: 'Brazil', img: 'https://flagcdn.com/w320/br.png' },
  { name: 'France', img: 'https://flagcdn.com/w320/fr.png' },
  { name: 'Argentina', img: 'https://flagcdn.com/w320/ar.png' },
  { name: 'England', img: 'https://flagcdn.com/w320/gb-eng.png' },
  { name: 'Germany', img: 'https://flagcdn.com/w320/de.png' },
  { name: 'Spain', img: 'https://flagcdn.com/w320/es.png' },
  { name: 'Portugal', img: 'https://flagcdn.com/w320/pt.png' },
  { name: 'Netherlands', img: 'https://flagcdn.com/w320/nl.png' },
  { name: 'Japan', img: 'https://flagcdn.com/w320/jp.png' },
];

export const pointsData = [
  { label: 'Round of 32', pts: '2' },
  { label: 'Semi Final', pts: '10' },
  { label: 'Final', pts: '20' },
];

export const TrophyIcon = () => (
  <svg
    width="54"
    height="66"
    viewBox="0 0 72 88"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 22px rgba(245,197,24,0.65))' }}
  >
    <path d="M24 72 L48 72 L44 80 L28 80 Z" fill="#F5C518" opacity="0.9" />
    <rect x="22" y="80" width="28" height="5" rx="2" fill="#F5C518" />
    <path
      d="M28 48 C28 48 20 44 16 36 C12 28 14 20 14 20 L22 20 L22 28 C22 38 28 44 36 48 C44 44 50 38 50 28 L50 20 L58 20 C58 20 60 28 56 36 C52 44 44 48 44 48 L44 72 L28 72 Z"
      fill="#F5C518"
    />
    <path
      d="M22 20 L50 20 L50 12 C50 8 47 6 44 6 L28 6 C25 6 22 8 22 12 Z"
      fill="#F5C518"
      opacity="0.85"
    />
    <path d="M28 6 C28 4 30 2 36 2 C42 2 44 4 44 6" stroke="#F5C518" strokeWidth="2" fill="none" opacity="0.5" />
    <ellipse cx="36" cy="22" rx="8" ry="5" fill="rgba(255,255,255,0.15)" />
  </svg>
);

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
    <div className="min-h-screen flex" >

      {/* ════════════════════════════════
           LEFT PANEL — Flag collage
      ════════════════════════════════ */}
      <div
        className="hidden lg:block w-[52%] relative overflow-hidden"
        style={{ background: '#060b18' }}
      >
        {/* 3×3 flag mosaic */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-1" style={{ opacity: 0.7 }}>
          {wcTeams.map((team) => (
            <div key={team.name} className="relative overflow-hidden rounded-xl">
              <img
                src={team.img}
                alt={team.name}
                className="w-full h-full object-cover"
              />
              {/* Per-cell dark tint */}
              <div className="absolute inset-0 rounded-xl" style={{ background: 'rgba(6,11,24,0.38)' }} />
              {/* Team name at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 px-2.5 py-2 rounded-b-xl"
                style={{ background: 'linear-gradient(to top, rgba(6,11,24,0.9), transparent)' }}
              >
                <p className=" text-[9px] font-semibold tracking-[2px] uppercase">
                  {team.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Full panel gradient overlay — dark top & bottom, transparent middle */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(6,11,24,0.72) 0%, rgba(6,11,24,0.05) 30%, rgba(6,11,24,0.05) 65%, rgba(6,11,24,0.88) 100%)',
          }}
        />

        {/* Gold top glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '420px',
            height: '420px',
            background: 'radial-gradient(circle, rgba(245,197,24,0.14) 0%, transparent 65%)',
          }}
        />

        {/* ── Content overlay ── */}
        <div className="absolute inset-0 flex flex-col justify-between p-10 z-10">

          {/* Top: Trophy + brand */}
          <div className="flex flex-col items-start gap-3">
            <TrophyIcon />
            <div>
              <h1
                className="leading-none tracking-widest"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '54px',
                  color: '#F5C518',
                  textShadow: '0 2px 32px rgba(245,197,24,0.4)',
                }}
              >
                NBWC 2026
              </h1>
              <p
                className="text-[11px] tracking-[3.5px] uppercase mt-1.5"
                style={{ color: 'rgba(255,255,255,0.42)' }}
              >
                World Cup Prediction League
              </p>
            </div>
          </div>

          {/* Bottom: Tagline + points strip */}
          <div>
            <p
              className="font-bold leading-tight mb-2"
              style={{
                fontSize: '26px',
                color: '#ffffff',
                textShadow: '0 1px 16px rgba(0,0,0,0.7)',
              }}
            >
              Predict. Compete.{' '}
              <span style={{ color: '#F5C518' }}>Win.</span>
            </p>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: 'rgba(255,255,255,0.42)', maxWidth: '300px' }}
            >
              Pick match winners across every round and rise to the top of Bangladesh's national leaderboard.
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {pointsData.map(({ label, pts }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '0.5px solid rgba(245,197,24,0.22)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '30px',
                      color: '#F5C518',
                      lineHeight: 1,
                    }}
                  >
                    {pts}
                  </p>
                  <p className="text-[10px] mt-1 tracking-wide" >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
           RIGHT PANEL — Form
      ════════════════════════════════ */}
      {/* ════════════════════════════════
     RIGHT PANEL — Form
════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col justify-center px-8 py-10 sm:px-12"
        style={{ background: '#f3f3f9' }}
      >
        <div className="w-full max-w-sm mx-auto">

          {/* Logo row */}
          <div className="flex items-center gap-3 mb-7">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#1a1f2e' }}
            >
              <Star className="w-4 h-4" style={{ color: '#F5C518' }} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide" style={{ color: '#0f1623' }}>NBWC Predictions</p>
              <p className="text-[10px]" style={{ color: '#9494a8' }}>FIFA World Cup Qualifier</p>
            </div>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: '#ffffff',
              border: '1px solid #e6e6f0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            {/* Live badge */}
            <div className="mb-5">
              <span
                className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[1.5px] uppercase px-3 py-1.5 rounded-full"
                style={{ background: '#fff0f0', border: '0.5px solid #fccaca', color: '#dc2626' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                Round of 32 open for predictions
              </span>
            </div>

            <h2 className="text-2xl font-semibold mb-1" style={{ color: '#0f1623' }}>Welcome back</h2>
            <p className="text-xs mb-6 leading-relaxed" style={{ color: '#9494a8' }}>
              Sign in and climb the national leaderboard.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase mb-2" style={{ color: '#9494a8' }}>
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#b0b0c3' }} />
                  <input
                    {...register('phone', { required: 'Phone number is required' })}
                    type="tel"
                    placeholder="+880XXXXXXXXXX"
                    className="w-full rounded-[10px] text-sm pl-9 pr-4 py-3 outline-none transition-all"
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e2ec',
                      color: '#0f1623',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                    onFocus={e => {
                      e.target.style.border = '1px solid #6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.border = '1px solid #e2e2ec';
                      e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                    }}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase mb-2" style={{ color: '#9494a8' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#b0b0c3' }} />
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-[10px] text-sm pl-9 pr-10 py-3 outline-none transition-all"
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e2ec',
                      color: '#0f1623',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                    onFocus={e => {
                      e.target.style.border = '1px solid #6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.border = '1px solid #e2e2ec';
                      e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c4d4' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6b6b80')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#c4c4d4')}
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              {/* Forgot */}
              <div className="flex justify-end pt-0.5">
                <Link to="/forgot-password" className="text-[11px] font-medium" style={{ color: '#F5C518' }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[10px] py-3 text-sm font-semibold tracking-wide transition-all disabled:opacity-60"
                style={{ background: '#1a1f2e', color: '#F5C518' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0f1623'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1a1f2e'; }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: '#e6e6f0' }} />
              <span className="text-[10px] tracking-[2px] uppercase" style={{ color: '#c0c0d0' }}>New here?</span>
              <div className="flex-1 h-px" style={{ background: '#e6e6f0' }} />
            </div>

            <p className="text-center text-xs" style={{ color: '#9494a8' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium" style={{ color: '#F5C518' }}>Sign up free</Link>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
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
