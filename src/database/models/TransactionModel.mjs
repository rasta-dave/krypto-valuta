import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    outputMap: {
      type: Object,
      required: true,
    },
    input: {
      timestamp: {
        type: Number,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      signature: {
        type: Object,
        required: true,
      },
    },
    blockHash: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ id: 1 });
transactionSchema.index({ 'input.address': 1 });
transactionSchema.index({ blockHash: 1 });
transactionSchema.index({ status: 1 });

export default mongoose.model('Transaction', transactionSchema);
