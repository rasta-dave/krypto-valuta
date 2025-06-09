import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} from '../controllers/auth-controller.mjs';
import { protect } from '../middleware/authMiddleware.mjs';
import {
  authLimiter,
  createAccountLimiter,
} from '../middleware/rateLimitMiddleware.mjs';
import { validateAuthInput } from '../middleware/sanitizationMiddleware.mjs';

const router = express.Router();

router.post('/register', createAccountLimiter, validateAuthInput, register);
router.post('/login', authLimiter, validateAuthInput, login);
router.post('/logout', logout);

router.use(protect);

router.get('/me', getMe);
router.patch('/update-profile', validateAuthInput, updateProfile);

export default router;
