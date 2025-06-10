import express from 'express';
import {
  getBlockchain,
  getBlocks,
  getBlock,
  searchBlockchain,
  getBlockchainLength,
  getStats,
  resetBlockchain,
} from '../controllers/blockchain-controller.mjs';

const router = express.Router();

router.route('/').get(getBlocks);
router.route('/full').get(getBlockchain);
router.route('/search').get(searchBlockchain);
router.route('/stats').get(getStats);
router.route('/length').get(getBlockchainLength);
router.route('/:hash').get(getBlock);
router.route('/reset').delete(resetBlockchain);

export default router;
