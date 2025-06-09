import { createHash } from '../../utilities/hash.mjs';
import Block from './block.mjs';
import Transaction from '../wallet/transaction.mjs';
import Wallet from '../wallet/wallet.mjs';
import { REWARD_ADDRESS, MINING_REWARD } from '../../utilities/config.mjs';
import { BlockchainService } from '../../database/blockchainService.mjs';
import { TransactionValidator } from '../../utilities/transactionValidator.mjs';

export default class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
    this.isInitialized = false;
  }

  async initializeFromDatabase() {
    try {
      const savedChain = await BlockchainService.getBlockchain();
      if (savedChain.length > 1) {
        this.chain = savedChain;
        console.log(
          `Loaded blockchain from database with ${savedChain.length} blocks`
        );

        if (!this.validateFullChain()) {
          throw new Error('Loaded blockchain is invalid');
        }
      } else {
        await this.saveGenesisBlock();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing blockchain from database:', error);
      await this.saveGenesisBlock();
      this.isInitialized = true;
    }
  }

  async saveGenesisBlock() {
    try {
      await BlockchainService.saveBlock(this.chain[0], 0);
      console.log('Genesis block saved to database');
    } catch (error) {
      console.error('Error saving genesis block:', error);
    }
  }

  async addBlock({ data }) {
    try {
      TransactionValidator.validateBlockTransactions({ data }, this.chain);

      const addedBlock = Block.mineBlock({
        previousBlock: this.chain.at(-1),
        data,
      });

      this.chain.push(addedBlock);

      await BlockchainService.saveBlock(addedBlock, this.chain.length - 1);
      console.log(
        `Block ${addedBlock.hash} saved to database with ${data.length} transactions`
      );

      return addedBlock;
    } catch (error) {
      console.error('Error adding block:', error);
      throw error;
    }
  }

  async replaceChain(chain, callback) {
    if (chain.length <= this.chain.length) {
      console.log('Received chain is not longer than current chain');
      return false;
    }

    if (!Blockchain.isValid(chain)) {
      console.log('Received chain is invalid');
      return false;
    }

    try {
      if (!this.validateFullChainTransactions(chain)) {
        console.log('Received chain has invalid transactions');
        return false;
      }
    } catch (error) {
      console.error('Chain transaction validation failed:', error.message);
      return false;
    }

    if (callback) callback();

    this.chain = chain;

    try {
      for (let i = 0; i < chain.length; i++) {
        await BlockchainService.saveBlock(chain[i], i);
      }
      console.log('Blockchain replaced and saved to database');
    } catch (error) {
      console.error('Error saving replaced chain to database:', error);
    }

    return true;
  }

  validateTransactionData({ chain }) {
    try {
      return this.validateFullChainTransactions(chain);
    } catch (error) {
      console.error('Transaction validation failed:', error.message);
      return false;
    }
  }

  validateFullChainTransactions(chain = this.chain) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];

      try {
        TransactionValidator.validateBlockTransactions(
          block,
          chain.slice(0, i + 1)
        );
      } catch (error) {
        throw new Error(`Block ${i} validation failed: ${error.message}`);
      }
    }
    return true;
  }

  validateFullChain() {
    if (!Blockchain.isValid(this.chain)) {
      return false;
    }

    try {
      this.validateFullChainTransactions();
      return true;
    } catch (error) {
      console.error('Full chain validation failed:', error.message);
      return false;
    }
  }

  getBlockchainStats() {
    const totalBlocks = this.chain.length;
    let totalTransactions = 0;
    let totalRewards = 0;

    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      totalTransactions += block.data.length;

      const rewardTransactions = block.data.filter(
        (tx) => tx.input.address === REWARD_ADDRESS.address
      );
      totalRewards += rewardTransactions.length * MINING_REWARD;
    }

    return {
      totalBlocks,
      totalTransactions,
      totalRewards,
      lastBlockHash: this.chain.at(-1).hash,
      chainValid: this.validateFullChain(),
    };
  }

  static isValid(chain) {
    if (JSON.stringify(chain.at(0)) !== JSON.stringify(Block.genesis())) {
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, data, hash, lastHash, nonce, difficulty } =
        chain.at(i);
      const prevHash = chain[i - 1].hash;

      if (lastHash !== prevHash) return false;

      const validHash = createHash(
        timestamp,
        data,
        lastHash,
        nonce,
        difficulty
      );
      if (hash !== validHash) return false;
    }

    return true;
  }
}
