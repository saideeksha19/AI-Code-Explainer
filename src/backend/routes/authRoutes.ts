import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  getMe,
  updateProfile,
  changePassword,
  getUsers,
  updateUserRole,
  deleteUser
} from '../controllers/authController';
import { protect, admin } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Strict rate-limiting for auth-sensitive routes
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 registration/login attempts per IP
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

const resetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 password resets per IP
  message: 'Too many password reset requests. Please try again after 15 minutes.'
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshToken);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);
router.get('/me', protect as any, getMe);

// Profile and Password Modification
router.put('/profile', protect as any, updateProfile);
router.put('/change-password', protect as any, changePassword);

// Admin-Only Routes for User Management
router.get('/users', protect as any, admin as any, getUsers);
router.put('/users/:id/role', protect as any, admin as any, updateUserRole);
router.delete('/users/:id', protect as any, admin as any, deleteUser);

export default router;
