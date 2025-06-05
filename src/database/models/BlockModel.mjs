import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Number,
      required: true,
    },
    lastHash: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
    },
    data: {
      type: Array,
      default: [],
    },
    nonce: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: Number,
      required: true,
    },
    blockIndex: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

blockSchema.index({ hash: 1 });
blockSchema.index({ blockIndex: 1 });

export default mongoose.model('Block', blockSchema);
