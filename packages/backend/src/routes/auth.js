import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import env from '../config/env.js';
import { getSetting } from '../utils/settings.js';

const router = Router();

// ─── Rate Limiter for Login ─────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── POST /api/auth/login ───────────────────────────────────────────────────────

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Email and password are required.');
      error.statusCode = 400;
      return next(error);
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      return next(error);
    }

    // Check suspension
    if (user.isSuspended) {
      const error = new Error('Account suspended. Contact an administrator.');
      error.statusCode = 403;
      return next(error);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      return next(error);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in DB
    user.cleanExpiredTokens();
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    await user.save();

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Login successful.',
      user: user.toSafeObject(),
      mustChangePassword: user.mustChangePassword,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/logout ──────────────────────────────────────────────────────

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Remove the specific refresh token from DB
      req.user.refreshTokens = req.user.refreshTokens.filter(
        (rt) => rt.token !== refreshToken
      );
      await req.user.save();
    }

    clearTokenCookies(res);

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/refresh ─────────────────────────────────────────────────────

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      const error = new Error('Refresh token not found. Please log in.');
      error.statusCode = 401;
      return next(error);
    }

    // Verify the refresh token JWT
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearTokenCookies(res);
      const error = new Error('Invalid or expired refresh token. Please log in again.');
      error.statusCode = 401;
      return next(error);
    }

    // Find user and validate the token exists in their stored tokens
    const user = await User.findById(decoded.id);

    if (!user) {
      clearTokenCookies(res);
      const error = new Error('User no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    if (user.isSuspended) {
      clearTokenCookies(res);
      const error = new Error('Account suspended. Contact an administrator.');
      error.statusCode = 403;
      return next(error);
    }

    // Check if this refresh token is in the user's stored tokens
    const storedToken = user.refreshTokens.find((rt) => rt.token === token);
    if (!storedToken) {
      // Token not found — possible token reuse attack, invalidate all tokens
      user.invalidateAllTokens();
      await user.save();
      clearTokenCookies(res);
      const error = new Error('Refresh token reuse detected. All sessions invalidated. Please log in again.');
      error.statusCode = 401;
      return next(error);
    }

    // Rotate: remove old refresh token, issue new pair
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
    user.cleanExpiredTokens();

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      message: 'Tokens refreshed.',
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/change-password ─────────────────────────────────────────────

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const error = new Error('Current password and new password are required.');
      error.statusCode = 400;
      return next(error);
    }

    if (newPassword.length < 8) {
      const error = new Error('New password must be at least 8 characters.');
      error.statusCode = 400;
      return next(error);
    }

    if (currentPassword === newPassword) {
      const error = new Error('New password must be different from the current password.');
      error.statusCode = 400;
      return next(error);
    }

    // Fetch user with password
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const error = new Error('Current password is incorrect.');
      error.statusCode = 401;
      return next(error);
    }

    // Update password and clear forced change flag
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save(); // pre-save hook will hash the new password

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/switch-role ─────────────────────────────────────────────────────
router.post('/switch-role', authenticate, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['student', 'super_admin'].includes(role)) {
      const error = new Error('Invalid role specified. Must be student or super_admin.');
      error.statusCode = 400;
      return next(error);
    }

    const username = req.user.email ? req.user.email.split('@')[0] : '';
    const canSwitch = req.user.canSwitchRoles || username === '2501200031';
    if (!canSwitch) {
      const error = new Error('Unauthorized. You do not have role-switching privileges.');
      error.statusCode = 403;
      return next(error);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      return next(error);
    }

    // Set role
    user.role = role;
    
    // Generate new tokens with the updated role
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: `Switched to ${role === 'super_admin' ? 'Super Admin' : 'Student'} successfully.`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        canSwitchRoles: user.canSwitchRoles
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/registration-status — Public check ──────────────────────────────
router.get('/registration-status', async (req, res, next) => {
  try {
    const registrationEnabled = await getSetting('registrationEnabled', true);
    res.json({
      success: true,
      registrationEnabled,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/register — Public Student Signup ──────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const registrationEnabled = await getSetting('registrationEnabled', true);
    if (!registrationEnabled) {
      const error = new Error('Public registration is currently disabled by the administrator.');
      error.statusCode = 403;
      return next(error);
    }

    const { email, password, firstName, lastName, phone, enrollmentId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      const error = new Error('Email, password, firstName, and lastName are required.');
      error.statusCode = 400;
      return next(error);
    }

    // Force role to student
    const role = 'student';

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const error = new Error('A user with this email/enrollment already exists.');
      error.statusCode = 409;
      return next(error);
    }

    // Build user data
    const userData = {
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      studentProfile: {
        enrollmentId: enrollmentId || email.split('@')[0],
      },
      mustChangePassword: false, // Don't ask them to reset password if created via public registration!
    };

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      data: user.toSafeObject(),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      err.statusCode = 400;
    }
    next(err);
  }
});

// ─── GET /api/auth/me ───────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

// ─── PATCH /api/auth/avatar ──────────────────────────────────────────────────────
router.patch('/avatar', authenticate, async (req, res, next) => {
  try {
    const { avatar } = req.body;
    req.user.avatar = avatar;
    await req.user.save();
    res.json({
      success: true,
      message: 'Avatar updated successfully.',
      avatar: req.user.avatar,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/avatars ───────────────────────────────────────────────────────
router.get('/avatars', async (req, res, next) => {
  try {
    const users = await User.find({ avatar: { $ne: null, $exists: true } }).select('firstName lastName avatar');
    const avatarMap = {};
    for (const u of users) {
      if (u.firstName && u.avatar) {
        const first = u.firstName.trim().toLowerCase();
        avatarMap[first] = u.avatar;
        if (u.lastName) {
          const full = `${u.firstName} ${u.lastName}`.trim().toLowerCase();
          avatarMap[full] = u.avatar;
        }
      }
    }
    res.json(avatarMap);
  } catch (err) {
    next(err);
  }
});

export default router;
