import express from 'express';
import {
  addTransaction,
  getWalletInfo,
  getUserTransactions,
  listAllTransactions,
  mineTransactions,
} from '../controllers/transaction-controller.mjs';
import { protect, restrictTo } from '../middleware/authMiddleware.mjs';
import {
  transactionLimiter,
  miningLimiter,
} from '../middleware/rateLimitMiddleware.mjs';
import { validateTransactionInput } from '../middleware/sanitizationMiddleware.mjs';

const router = express.Router();

router.use(protect);

router
  .route('/transact')
  .post(transactionLimiter, validateTransactionInput, addTransaction);
router.route('/info').get(getWalletInfo);
router.route('/my-transactions').get(getUserTransactions);
router.route('/mine').post(miningLimiter, mineTransactions);

router.route('/transactions').get(restrictTo('admin'), listAllTransactions);

export default router;
