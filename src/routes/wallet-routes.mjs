import express from 'express';
import {
  getWalletInfo,
  createTransaction,
  getMyTransactions,
  mineBlock,
  getBalance,
} from '../controllers/wallet-controller.mjs';
import { protect } from '../middleware/authMiddleware.mjs';

const router = express.Router();

router.route('/info').get(protect, getWalletInfo);
router.route('/balance').get(protect, getBalance);
router.route('/transaction').post(protect, createTransaction);
router.route('/my-transactions').get(protect, getMyTransactions);
router.route('/mine').post(protect, mineBlock);

export default router;
