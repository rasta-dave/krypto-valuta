import { REWARD_ADDRESS } from '../../utilities/config.mjs';
import { TransactionValidator } from '../../utilities/transactionValidator.mjs';

export default class TransactionPool {
  constructor() {
    this.transactionMap = {};
  }

  setTransaction(transaction, blockchain) {
    try {
      if (transaction.input.address !== REWARD_ADDRESS.address) {
        TransactionValidator.validateOutputMapStructure(transaction);
        TransactionValidator.validateTransactionSignature(transaction);
        TransactionValidator.validateTransactionBalance(
          transaction,
          blockchain
        );
      }

      this.transactionMap[transaction.id] = transaction;
    } catch (error) {
      throw new Error(`Transaction validation failed: ${error.message}`);
    }
  }

  validTransactions() {
    return Object.values(this.transactionMap).filter((transaction) => {
      try {
        TransactionValidator.validateOutputMapStructure(transaction);
        TransactionValidator.validateTransactionSignature(transaction);
        return true;
      } catch (error) {
        console.warn(`Invalid transaction found in pool: ${error.message}`);
        return false;
      }
    });
  }

  clear() {
    this.transactionMap = {};
  }

  clearBlockchainTransactions({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];

      for (let transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    }
  }

  hasTransaction(address) {
    const transactions = Object.values(this.transactionMap);
    return transactions.find(
      (transaction) => transaction.input.address === address
    );
  }

  getTransactionCount() {
    return Object.keys(this.transactionMap).length;
  }

  getTransactionsByAddress(address) {
    return Object.values(this.transactionMap).filter(
      (transaction) =>
        transaction.input.address === address || transaction.outputMap[address]
    );
  }

  removeInvalidTransactions(blockchain) {
    const validTransactionIds = [];
    const invalidTransactionIds = [];

    Object.values(this.transactionMap).forEach((transaction) => {
      try {
        if (transaction.input.address !== REWARD_ADDRESS.address) {
          TransactionValidator.validateTransactionBalance(
            transaction,
            blockchain
          );
        }
        validTransactionIds.push(transaction.id);
      } catch (error) {
        invalidTransactionIds.push(transaction.id);
        console.warn(
          `Removing invalid transaction: ${transaction.id} - ${error.message}`
        );
      }
    });

    invalidTransactionIds.forEach((id) => {
      delete this.transactionMap[id];
    });

    return {
      removed: invalidTransactionIds.length,
      remaining: validTransactionIds.length,
    };
  }
}
