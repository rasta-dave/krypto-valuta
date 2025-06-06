import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} from '../controllers/auth-controller.mjs';
import { protect } from '../middleware/authMiddleware.mjs';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.use(protect);

router.get('/me', getMe);
router.patch('/update-profile', updateProfile);

export default router;
