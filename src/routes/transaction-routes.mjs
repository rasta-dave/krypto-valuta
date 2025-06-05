import express from 'express';
import {
  addTransaction,
  getWalletInfo,
  listAllTransactions,
  mineTransactions,
} from '../controllers/transaction-controller.mjs';

const router = express.Router();

router.route('/transact').post(addTransaction);
router.route('/info').get(getWalletInfo);
router.route('/transactions').get(listAllTransactions);
router.route('/mine').post(mineTransactions);

export default router;
