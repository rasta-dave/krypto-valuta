import mongoose from 'mongoose';

const blockchainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      default: 'SmartChain',
    },
    latestBlockHash: {
      type: String,
      required: true,
    },
    blockCount: {
      type: Number,
      required: true,
      default: 1,
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Blockchain', blockchainSchema);
