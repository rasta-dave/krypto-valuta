import express from 'express';
import {
  addTransaction,
  getWalletInfo,
  getUserTransactions,
  listAllTransactions,
  mineTransactions,
} from '../controllers/transaction-controller.mjs';
import { protect, restrictTo } from '../middleware/authMiddleware.mjs';

const router = express.Router();

router.use(protect);

router.route('/transact').post(addTransaction);
router.route('/info').get(getWalletInfo);
router.route('/my-transactions').get(getUserTransactions);
router.route('/mine').post(mineTransactions);

router.route('/transactions').get(restrictTo('admin'), listAllTransactions);

export default router;
