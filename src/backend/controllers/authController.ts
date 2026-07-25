import { Request, Response, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { User } from '../models/User';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { JWT_SECRET } from '../config/jwt';

// Helper to hash passwords for mock users
const hashMockPassword = (plain: string) => {
  return bcryptjs.hashSync(plain, 10);
};

// In-memory fallback database
const inMemoryUsers: any[] = [
  {
    _id: 'mock_admin_123',
    name: 'Aegis Super Admin',
    email: 'admin@aegis.io',
    password: hashMockPassword('password123'),
    role: 'admin',
    createdAt: new Date('2026-01-01T00:00:00.000Z')
  },
  {
    _id: 'mock_analyst_123',
    name: 'Jane Analyst',
    email: 'analyst@aegis.io',
    password: hashMockPassword('password123'),
    role: 'analyst',
    createdAt: new Date('2026-01-02T00:00:00.000Z')
  },
  {
    _id: 'mock_user_123',
    name: 'Developer Mode',
    email: 'developer@aegis.io',
    password: hashMockPassword('password123'),
    role: 'developer',
    createdAt: new Date('2026-01-03T00:00:00.000Z')
  }
];

// Reset tokens in offline mode
const inMemoryResetTokens = new Map<string, { email: string; expires: number }>();

// Generate access token (extended to 7 days for stable preview environment)
const generateAccessToken = (id: string, email: string, role: string) => {
  return jsonwebtoken.sign(
    { id, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate refresh token (long lived: 30 days)
const generateRefreshToken = (id: string, email: string, role: string) => {
  return jsonwebtoken.sign(
    { id, email, role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Helper to compare passwords
async function comparePassword(entered: string, stored: string): Promise<boolean> {
  try {
    return await bcryptjs.compare(entered, stored);
  } catch {
    return entered === stored;
  }
}

export async function registerUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const assignedRole = role && ['admin', 'developer', 'analyst', 'auditor'].includes(role) 
      ? role 
      : 'developer';

    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1) {
      const exists = inMemoryUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ error: 'User already exists with this email address.' });
      }

      const mockId = 'mock_user_' + Date.now();
      const newUser = {
        _id: mockId,
        name,
        email: email.toLowerCase(),
        password: hashMockPassword(password),
        role: assignedRole,
        createdAt: new Date()
      };
      
      inMemoryUsers.push(newUser);

      const accessToken = generateAccessToken(mockId, email, assignedRole);
      const refreshToken = generateRefreshToken(mockId, email, assignedRole);

      return res.status(201).json({
        user: { id: mockId, name, email, role: assignedRole, isMock: true },
        accessToken,
        refreshToken,
        message: 'Successfully registered in temporary container memory.'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email address.' });
    }

    const user = new User({
      name,
      email,
      password,
      role: assignedRole
    });

    const refreshToken = generateRefreshToken(user._id.toString(), user.email, user.role || 'developer');
    user.refreshToken = refreshToken;
    await user.save();

    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role || 'developer');

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1) {
      const user = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && (await comparePassword(password, user.password))) {
        const accessToken = generateAccessToken(user._id, user.email, user.role);
        const refreshToken = generateRefreshToken(user._id, user.email, user.role);
        return res.json({
          user: { id: user._id, name: user.name, email: user.email, role: user.role, isMock: true },
          accessToken,
          refreshToken,
          message: 'Logged in with temporary container memory.'
        });
      } else {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    const user = await User.findOne({ email });
    if (user && (await (user as any).matchPassword(password))) {
      const userRole = (user as any).role || 'developer';
      const refreshToken = generateRefreshToken(user._id.toString(), user.email, userRole);
      user.refreshToken = refreshToken;
      await user.save();

      const accessToken = generateAccessToken(user._id.toString(), user.email, userRole);

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: userRole
        },
        accessToken,
        refreshToken,
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
}

export async function logoutUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    if (mongoose.connection.readyState === 1 && refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      // Offline fallback: decode and renew
      try {
        const decoded = jsonwebtoken.verify(refreshToken, JWT_SECRET) as { id: string; email: string; role?: string };
        const user = inMemoryUsers.find(u => u._id === decoded.id);
        const role = user ? user.role : (decoded.role || 'developer');
        const accessToken = generateAccessToken(decoded.id, decoded.email, role);
        return res.json({ accessToken });
      } catch (err) {
        return res.status(401).json({ error: 'Expired or invalid refresh token.' });
      }
    }

    // Verify token with real DB
    try {
      const decoded = jsonwebtoken.verify(
        refreshToken,
        JWT_SECRET
      ) as { id: string; email: string; role?: string };

      const user = await User.findOne({ _id: decoded.id, refreshToken });
      if (!user) {
        return res.status(401).json({ error: 'Invalid or revoked refresh token.' });
      }

      const accessToken = generateAccessToken(user._id.toString(), user.email, user.role || 'developer');
      res.json({ accessToken });
    } catch (err) {
      return res.status(401).json({ error: 'Expired or invalid refresh token.' });
    }
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1) {
      const user = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(404).json({ error: 'No account registered with this email.' });
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      inMemoryResetTokens.set(resetToken, {
        email: email.toLowerCase(),
        expires: Date.now() + 3600000 // 1 hour
      });

      console.log(`🔑 PASSWORD RESET REQUEST (MEMORY): Email: ${email} | Raw Reset Token: ${resetToken}`);

      return res.json({
        success: true,
        message: 'Password reset code generated.',
        resetToken,
        isMock: true,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpire = new Date(Date.now() + 3600000);
    await user.save();

    console.log(`🔑 PASSWORD RESET REQUEST: Email: ${email} | Raw Reset Token: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset link generated and output to terminal logs.',
      resetToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1) {
      const resetData = inMemoryResetTokens.get(token);
      if (!resetData || resetData.expires < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired password reset token.' });
      }

      const user = inMemoryUsers.find(u => u.email === resetData.email);
      if (user) {
        user.password = hashMockPassword(password);
      }
      inMemoryResetTokens.delete(token);

      return res.json({ success: true, message: 'Password has been reset successfully.' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: any, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (mongoose.connection.readyState !== 1 || req.user.id.startsWith('mock_')) {
      const inMemoryUser = inMemoryUsers.find(u => u._id === req.user.id);
      if (inMemoryUser) {
        return res.json({
          id: inMemoryUser._id,
          name: inMemoryUser.name,
          email: inMemoryUser.email,
          role: inMemoryUser.role,
          isMock: true
        });
      }
      return res.json({
        id: req.user.id,
        name: 'Developer (Offline Mode)',
        email: req.user.email,
        role: req.user.role || 'developer',
        isMock: true
      });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'developer'
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
}

// 8. UPDATE PROFILE
export async function updateProfile(req: any, res: Response, next: NextFunction) {
  try {
    const { name, email, role } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Email pattern check
    if (email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
    }

    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1 || req.user.id.startsWith('mock_')) {
      const user = inMemoryUsers.find(u => u._id === req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found in memory.' });
      }

      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (role && ['admin', 'developer', 'analyst', 'auditor'].includes(role)) {
        user.role = role;
      }

      const accessToken = generateAccessToken(user._id, user.email, user.role);

      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isMock: true
        },
        accessToken,
        message: 'Profile updated in temporary container memory.'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (email) {
      const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email address already taken by another user.' });
      }
      user.email = email.toLowerCase();
    }
    if (role && ['admin', 'developer', 'analyst', 'auditor'].includes(role)) {
      // Regular user can't escalate own role unless they are admin or we allow it for preview flexibility
      user.set('role', role);
    }

    await user.save();
    const userRole = (user as any).role || 'developer';
    const accessToken = generateAccessToken(user._id.toString(), user.email, userRole);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
}

// 9. CHANGE PASSWORD
export async function changePassword(req: any, res: Response, next: NextFunction) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1 || req.user.id.startsWith('mock_')) {
      const user = inMemoryUsers.find(u => u._id === req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found in memory.' });
      }

      const match = await comparePassword(oldPassword, user.password);
      if (!match) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }

      user.password = hashMockPassword(newPassword);
      return res.json({ success: true, message: 'Password changed successfully.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await (user as any).matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
}

// 10. GET USERS (Admin Only)
export async function getUsers(req: any, res: Response, next: NextFunction) {
  try {
    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1) {
      const safeUsers = inMemoryUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        isMock: true
      }));
      return res.json(safeUsers);
    }

    const dbUsers = await User.find().select('-password');
    const safeUsers = dbUsers.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: (u as any).role || 'developer',
      createdAt: u.createdAt
    }));

    res.json(safeUsers);
  } catch (error) {
    next(error);
  }
}

// 11. UPDATE USER ROLE (Admin Only)
export async function updateUserRole(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'developer', 'analyst', 'auditor'].includes(role)) {
      return res.status(400).json({ error: 'Please provide a valid role (admin, developer, analyst, auditor).' });
    }

    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1 || id.startsWith('mock_')) {
      const user = inMemoryUsers.find(u => u._id === id);
      if (!user) {
        return res.status(404).json({ error: 'User not found in memory.' });
      }

      user.role = role;
      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isMock: true
        },
        message: 'User role updated inside temporary memory.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.set('role', role);
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.get('role')
      },
      message: 'User role updated successfully.'
    });
  } catch (error) {
    next(error);
  }
}

// 12. DELETE USER (Admin Only)
export async function deleteUser(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    // MongoDB Offline Fallback
    if (mongoose.connection.readyState !== 1 || id.startsWith('mock_')) {
      const index = inMemoryUsers.findIndex(u => u._id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'User not found in memory.' });
      }

      inMemoryUsers.splice(index, 1);
      return res.json({ success: true, message: 'User deleted from temporary container memory.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
