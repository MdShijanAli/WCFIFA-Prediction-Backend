import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import {
  createOTP,
  verifyOTP,
  sendSMSOTP,
  sendEmailOTP,
} from '../services/otp.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, dob, gender, phone, email, password } = req.body;

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      res.status(400).json({ message: 'Phone number already registered' });
      return;
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        res.status(400).json({ message: 'Email already registered' });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        dob: new Date(dob),
        gender,
        phone,
        email: email || null,
        password: hashedPassword,
      },
    });

    await prisma.leaderboardEntry.create({ data: { userId: user.id } });

    const code = await createOTP(user.id, 'PHONE_VERIFY', phone);
    await sendSMSOTP(phone, code);

    res.status(201).json({
      message: 'Registration successful. Please verify your phone number.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const verifyPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, code } = req.body;

    const isValid = await verifyOTP(userId, code, 'PHONE_VERIFY');
    if (!isValid) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isPhoneVerified: true },
    });

    const token = generateToken({ userId: user.id, phone: user.phone });

    res.json({
      message: 'Phone verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.status(401).json({ message: 'Invalid phone or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid phone or password' });
      return;
    }

    if (!user.isPhoneVerified) {
      const code = await createOTP(user.id, 'PHONE_VERIFY', user.phone);
      await sendSMSOTP(user.phone, code);
      res.status(403).json({
        message: 'Phone not verified. OTP sent.',
        requiresVerification: true,
        userId: user.id,
      });
      return;
    }

    const token = generateToken({ userId: user.id, phone: user.phone });

    const payment = await prisma.payment.findUnique({ where: { userId: user.id } });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        hasPaid: payment?.status === 'COMPLETED',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, type } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (type === 'PHONE_VERIFY') {
      const code = await createOTP(user.id, 'PHONE_VERIFY', user.phone);
      await sendSMSOTP(user.phone, code);
    } else if (type === 'EMAIL_VERIFY' && user.email) {
      const code = await createOTP(user.id, 'EMAIL_VERIFY', user.email);
      await sendEmailOTP(user.email, code, 'EMAIL_VERIFY');
    }

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.json({ message: 'If that number exists, an OTP has been sent.' });
      return;
    }

    const code = await createOTP(user.id, 'FORGOT_PASSWORD', phone);
    await sendSMSOTP(phone, code);

    res.json({
      message: 'OTP sent to your registered phone number',
      userId: user.id,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, code, newPassword } = req.body;

    const isValid = await verifyOTP(userId, code, 'FORGOT_PASSWORD');
    if (!isValid) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) {
      res.status(400).json({ message: 'No email on file' });
      return;
    }

    const isValid = await verifyOTP(userId, code, 'EMAIL_VERIFY');
    if (!isValid) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    await prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, dob: true, gender: true,
        phone: true, email: true, isPhoneVerified: true,
        isEmailVerified: true, createdAt: true,
      },
    });

    const payment = await prisma.payment.findUnique({ where: { userId } });
    res.json({ user, hasPaid: payment?.status === 'COMPLETED' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};
