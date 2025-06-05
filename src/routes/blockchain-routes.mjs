import express from 'express';
import {
  getBlockchain,
  getBlockchainLength,
} from '../controllers/blockchain-controller.mjs';

const router = express.Router();

router.route('/').get(getBlockchain);
router.route('/length').get(getBlockchainLength);

export default router;
