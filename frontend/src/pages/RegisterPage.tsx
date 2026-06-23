import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Trophy, User, Phone, Mail, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import OTPModal from "../components/auth/OTPModal";
import { pointsData, TrophyIcon, wcTeams } from "./LoginPage";

interface RegisterForm {
  name: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpState, setOtpState] = useState<{
    show: boolean;
    userId: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();
  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      const res = await authApi.register(payload);
      setOtpState({ show: true, userId: res.data.userId });
      toast.success("Account created! Please verify your phone.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = (token: string, user: any) => {
    login(token, user);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#060b18" }}>
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
                <p className="text-white text-[9px] font-semibold tracking-[2px] uppercase">
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
                  <p className="text-[10px] mt-1 tracking-wide" style={{ color: 'rgba(255,255,255,0.38)' }}>
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
        className="flex-1 flex flex-col justify-center px-8 py-8 sm:px-12 overflow-y-auto"
        style={{ background: '#f3f3f9' }}
      >
        <div className="w-full max-w-sm mx-auto">

          {/* Logo row */}
          <div className="flex items-center gap-3 mb-5">
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
            className="rounded-2xl p-6"
            style={{
              background: '#ffffff',
              border: '1px solid #e6e6f0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            {/* Live badge */}
            <div className="mb-4">
              <span
                className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[1.5px] uppercase px-3 py-1.5 rounded-full"
                style={{ background: '#fff0f0', border: '0.5px solid #fccaca', color: '#dc2626' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                Round of 32 open for predictions
              </span>
            </div>

            <h2 className="text-xl font-semibold mb-1" style={{ color: '#0f1623' }}>Create your account</h2>
            <p className="text-xs mb-5 leading-relaxed" style={{ color: '#9494a8' }}>
              Join the league and start making predictions.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

              {/* Row 1: Name + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase mb-1.5" style={{ color: '#9494a8' }}>
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#b0b0c3' }} />
                    <input
                      {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })}
                      placeholder="Your full name"
                      className="w-full rounded-[10px] text-[12.5px] pl-8 pr-3 py-2.5 outline-none transition-all"
                      style={{
                        background: '#fff', border: '1px solid #e2e2ec',
                        color: '#0f1623', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                      onFocus={e => { e.target.style.border = '1px solid #6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                      onBlur={e => { e.target.style.border = '1px solid #e2e2ec'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase mb-1.5" style={{ color: '#9494a8' }}>
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#b0b0c3' }} />
                    <input
                      {...register('phone', { required: 'Phone is required', pattern: { value: /^\+?[0-9]{10,15}$/, message: 'Invalid number' } })}
                      type="tel"
                      placeholder="+880XXXXXXXXXX"
                      className="w-full rounded-[10px] text-[12.5px] pl-8 pr-3 py-2.5 outline-none transition-all"
                      style={{
                        background: '#fff', border: '1px solid #e2e2ec',
                        color: '#0f1623', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                      onFocus={e => { e.target.style.border = '1px solid #6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                      onBlur={e => { e.target.style.border = '1px solid #e2e2ec'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase mb-1.5" style={{ color: '#9494a8' }}>
                  Email <span className="text-[9px] font-normal normal-case tracking-normal" style={{ color: '#b0b0c3' }}>(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#b0b0c3' }} />
                  <input
                    {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
                    type="email"
                    placeholder="your@email.com"
                    className="w-full rounded-[10px] text-[12.5px] pl-8 pr-3 py-2.5 outline-none transition-all"
                    style={{
                      background: '#fff', border: '1px solid #e2e2ec',
                      color: '#0f1623', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                    onFocus={e => { e.target.style.border = '1px solid #6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                    onBlur={e => { e.target.style.border = '1px solid #e2e2ec'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email.message}</p>}
              </div>

              {/* Row 2: Password + Confirm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase mb-1.5" style={{ color: '#9494a8' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min. 8 characters' } })}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 chars"
                      className="w-full rounded-[10px] text-[12.5px] px-3 py-2.5 pr-8 outline-none transition-all"
                      style={{
                        background: '#fff', border: '1px solid #e2e2ec',
                        color: '#0f1623', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                      onFocus={e => { e.target.style.border = '1px solid #6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                      onBlur={e => { e.target.style.border = '1px solid #e2e2ec'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c4d4' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6b6b80')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#c4c4d4')}
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[11px] mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold tracking-[1.8px] uppercase mb-1.5" style={{ color: '#9494a8' }}>
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword', { required: 'Required', validate: v => v === password || 'Passwords do not match' })}
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="Re-enter"
                      className="w-full rounded-[10px] text-[12.5px] px-3 py-2.5 pr-8 outline-none transition-all"
                      style={{
                        background: '#fff', border: '1px solid #e2e2ec',
                        color: '#0f1623', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                      onFocus={e => { e.target.style.border = '1px solid #6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                      onBlur={e => { e.target.style.border = '1px solid #e2e2ec'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c4d4' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6b6b80')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#c4c4d4')}
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-[11px] mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[10px] py-3 text-sm font-semibold tracking-wide transition-all disabled:opacity-60 mt-1"
                style={{ background: '#1a1f2e', color: '#F5C518' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0f1623'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1a1f2e'; }}
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#9494a8' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#F5C518' }}>Sign in</Link>
          </p>

        </div>
      </div>

      {
        otpState && (
          <OTPModal
            userId={otpState.userId}
            type="PHONE_VERIFY"
            onSuccess={handleOTPVerified}
            onClose={() => setOtpState(null)}
          />
        )
      }
    </div >
  );
}
