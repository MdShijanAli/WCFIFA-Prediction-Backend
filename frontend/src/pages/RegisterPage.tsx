import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Trophy, User, Phone, Mail, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import OTPModal from '../components/auth/OTPModal';

interface RegisterForm {
  name: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpState, setOtpState] = useState<{ show: boolean; userId: string } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      const res = await authApi.register(payload);
      setOtpState({ show: true, userId: res.data.userId });
      toast.success('Account created! Please verify your phone.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = (token: string, user: any) => {
    login(token, user);
    navigate('/payment');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white font-bold text-xl">NBWC Prediction</h1>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 mb-6">Join the FIFA WC Qualifying Prediction Competition</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })}
                  placeholder="Your full name"
                  className="input-field pl-12"
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    {...register('dob', { required: 'Date of birth is required' })}
                    type="date"
                    className="input-field pl-12"
                  />
                </div>
                {errors.dob && <p className="text-red-400 text-xs mt-1">{errors.dob.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Gender</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className="input-field pl-12 appearance-none"
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  {...register('phone', {
                    required: 'Phone is required',
                    pattern: { value: /^\+?[0-9]{10,15}$/, message: 'Invalid phone number' }
                  })}
                  type="tel"
                  placeholder="+880XXXXXXXXXX"
                  className="input-field pl-12"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  {...register('email', {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
                  })}
                  type="email"
                  placeholder="your@email.com"
                  className="input-field pl-12"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' }
                  })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: v => v === password || 'Passwords do not match'
                })}
                type="password"
                placeholder="Re-enter password"
                className="input-field"
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-4 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
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
