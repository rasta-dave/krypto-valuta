import express from 'express';
import {
  getBlockchain,
  getBlockchainLength,
  getStats,
} from '../controllers/blockchain-controller.mjs';

const router = express.Router();

router.route('/').get(getBlockchain);
router.route('/length').get(getBlockchainLength);
router.route('/stats').get(getStats);

export default router;
