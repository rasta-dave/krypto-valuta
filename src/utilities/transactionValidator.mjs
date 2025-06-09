import { verifySignature } from './keyManager.mjs';
import { REWARD_ADDRESS, MINING_REWARD } from './config.mjs';

export class TransactionValidator {
  static validateOutputMapStructure(transaction) {
    const { outputMap, input } = transaction;

    if (!outputMap || typeof outputMap !== 'object') {
      throw new Error('Transaction must have a valid outputMap');
    }

    if (!input || typeof input !== 'object') {
      throw new Error('Transaction must have a valid input');
    }

    const outputTotal = Object.values(outputMap).reduce((sum, amount) => {
      if (typeof amount !== 'number' || amount < 0) {
        throw new Error('OutputMap amounts must be positive numbers');
      }
      return sum + amount;
    }, 0);

    if (Math.abs(outputTotal - input.amount) > 0.00001) {
      throw new Error('OutputMap total must equal input amount');
    }

    const addresses = Object.keys(outputMap);
    if (addresses.length === 0) {
      throw new Error('OutputMap must contain at least one recipient');
    }

    addresses.forEach((address) => {
      if (typeof address !== 'string' || address.length < 10) {
        throw new Error('All addresses in outputMap must be valid strings');
      }
    });

    return true;
  }

  static validateTransactionSignature(transaction) {
    const { input, outputMap } = transaction;

    if (input.address === REWARD_ADDRESS.address) {
      return true;
    }

    if (!input.signature) {
      throw new Error('Transaction must have a valid signature');
    }

    if (
      !verifySignature({
        publicKey: input.address,
        data: outputMap,
        signature: input.signature,
      })
    ) {
      throw new Error('Transaction signature is invalid');
    }

    return true;
  }

  static validateRewardTransaction(transaction) {
    if (transaction.input.address !== REWARD_ADDRESS.address) {
      return false;
    }

    const outputAddresses = Object.keys(transaction.outputMap);
    if (outputAddresses.length !== 1) {
      throw new Error('Reward transaction must have exactly one recipient');
    }

    const rewardAmount = Object.values(transaction.outputMap)[0];
    if (rewardAmount !== MINING_REWARD) {
      throw new Error(
        `Reward transaction must award exactly ${MINING_REWARD} coins`
      );
    }

    return true;
  }

  static validateTransactionBalance(transaction, blockchain) {
    if (transaction.input.address === REWARD_ADDRESS.address) {
      return true;
    }

    const senderAddress = transaction.input.address;
    let senderBalance = 0;
    let foundTransaction = false;

    for (let i = blockchain.length - 1; i > 0; i--) {
      const block = blockchain[i];

      for (let blockTransaction of block.data) {
        if (blockTransaction.input.address === senderAddress) {
          foundTransaction = true;
        }

        const amount = blockTransaction.outputMap[senderAddress];
        if (amount) {
          senderBalance += amount;
        }
      }

      if (foundTransaction) break;
    }

    if (!foundTransaction) {
      senderBalance = 1000;
    }

    const totalSpent = Object.values(transaction.outputMap).reduce(
      (sum, amount) => sum + amount,
      0
    );

    if (totalSpent > senderBalance) {
      throw new Error(
        `Insufficient balance. Available: ${senderBalance}, Required: ${totalSpent}`
      );
    }

    return true;
  }

  static validateTransactionInBlock(transaction, block, blockchain) {
    this.validateOutputMapStructure(transaction);
    this.validateTransactionSignature(transaction);

    if (!this.validateRewardTransaction(transaction)) {
      this.validateTransactionBalance(transaction, blockchain);
    }

    return true;
  }

  static validateUniqueTransactions(transactions) {
    const transactionIds = new Set();
    const senderNonces = new Map();

    for (let transaction of transactions) {
      if (transactionIds.has(transaction.id)) {
        throw new Error(`Duplicate transaction found: ${transaction.id}`);
      }
      transactionIds.add(transaction.id);

      if (transaction.input.address !== REWARD_ADDRESS.address) {
        const senderAddress = transaction.input.address;
        const nonce = transaction.input.timestamp;

        if (senderNonces.has(senderAddress)) {
          const existingNonce = senderNonces.get(senderAddress);
          if (nonce <= existingNonce) {
            throw new Error(
              `Invalid transaction ordering for sender: ${senderAddress}`
            );
          }
        }
        senderNonces.set(senderAddress, nonce);
      }
    }

    return true;
  }

  static validateBlockTransactions(block, blockchain) {
    if (!block.data || !Array.isArray(block.data)) {
      throw new Error('Block must contain a valid data array');
    }

    this.validateUniqueTransactions(block.data);

    let rewardTransactionCount = 0;

    for (let transaction of block.data) {
      if (transaction.input.address === REWARD_ADDRESS.address) {
        rewardTransactionCount++;
      }

      this.validateTransactionInBlock(transaction, block, blockchain);
    }

    if (rewardTransactionCount === 0) {
      throw new Error('Block must contain exactly one reward transaction');
    }

    if (rewardTransactionCount > 1) {
      throw new Error('Block cannot contain more than one reward transaction');
    }

    return true;
  }
}
