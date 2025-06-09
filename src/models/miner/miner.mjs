import Transaction from '../wallet/transaction.mjs';
import { TransactionValidator } from '../../utilities/transactionValidator.mjs';

export default class Miner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  async mineTransactions() {
    try {
      const validTransactions = this.transactionPool.validTransactions();

      if (validTransactions.length === 0) {
        throw new Error('No valid transactions to mine');
      }

      const cleanupResult = this.transactionPool.removeInvalidTransactions(
        this.blockchain.chain
      );
      if (cleanupResult.removed > 0) {
        console.log(
          `Removed ${cleanupResult.removed} invalid transactions from pool`
        );
      }

      const finalValidTransactions = this.transactionPool.validTransactions();

      if (finalValidTransactions.length === 0) {
        throw new Error('No valid transactions remaining after cleanup');
      }

      try {
        TransactionValidator.validateUniqueTransactions(finalValidTransactions);
      } catch (error) {
        throw new Error(
          `Transaction uniqueness validation failed: ${error.message}`
        );
      }

      const rewardTransaction = Transaction.rewardTransaction({
        minerWallet: this.wallet,
      });

      const blockTransactions = [rewardTransaction, ...finalValidTransactions];

      try {
        TransactionValidator.validateBlockTransactions(
          { data: blockTransactions },
          this.blockchain.chain
        );
      } catch (error) {
        throw new Error(`Block validation failed: ${error.message}`);
      }

      const minedBlock = await this.blockchain.addBlock({
        data: blockTransactions,
      });

      this.transactionPool.clearBlockchainTransactions({
        chain: this.blockchain.chain,
      });

      if (this.pubsub) {
        this.pubsub.broadcastChain();
      }

      return {
        success: true,
        block: minedBlock,
        transactionCount: blockTransactions.length,
        rewardAmount: rewardTransaction.outputMap[this.wallet.publicKey],
        stats: {
          totalTransactions: blockTransactions.length,
          validTransactions: finalValidTransactions.length,
          rewardTransactions: 1,
          blockHash: minedBlock.hash,
          difficulty: minedBlock.difficulty,
          nonce: minedBlock.nonce,
        },
      };
    } catch (error) {
      console.error('Mining failed:', error.message);
      throw error;
    }
  }

  async quickMine() {
    try {
      const rewardTransaction = Transaction.rewardTransaction({
        minerWallet: this.wallet,
      });

      const minedBlock = await this.blockchain.addBlock({
        data: [rewardTransaction],
      });

      if (this.pubsub) {
        this.pubsub.broadcastChain();
      }

      return {
        success: true,
        block: minedBlock,
        transactionCount: 1,
        rewardAmount: rewardTransaction.outputMap[this.wallet.publicKey],
        stats: {
          totalTransactions: 1,
          validTransactions: 0,
          rewardTransactions: 1,
          blockHash: minedBlock.hash,
          difficulty: minedBlock.difficulty,
          nonce: minedBlock.nonce,
        },
      };
    } catch (error) {
      console.error('Quick mining failed:', error.message);
      throw error;
    }
  }

  getMiningStats() {
    const poolStats = {
      totalTransactions: this.transactionPool.getTransactionCount(),
      validTransactions: this.transactionPool.validTransactions().length,
    };

    const blockchainStats = this.blockchain.getBlockchainStats();

    return {
      pool: poolStats,
      blockchain: blockchainStats,
      miner: {
        address: this.wallet.publicKey,
        balance: this.wallet.balance,
      },
    };
  }
}
