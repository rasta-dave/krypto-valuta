import { createHash } from '../../utilities/hash.mjs';
import Block from './block.mjs';
import Transaction from '../wallet/transaction.mjs';
import Wallet from '../wallet/wallet.mjs';
import { REWARD_ADDRESS, MINING_REWARD } from '../../utilities/config.mjs';
import { BlockchainService } from '../../database/blockchainService.mjs';

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
    const addedBlock = Block.mineBlock({
      previousBlock: this.chain.at(-1),
      data,
    });

    this.chain.push(addedBlock);

    try {
      await BlockchainService.saveBlock(addedBlock, this.chain.length - 1);
      console.log(`Block ${addedBlock.hash} saved to database`);
    } catch (error) {
      console.error('Error saving block to database:', error);
    }
  }

  async replaceChain(chain, callback) {
    if (chain.length <= this.chain.length) return;

    if (!Blockchain.isValid(chain)) return;

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
  }

  validateTransactionData({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      let rewardCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_ADDRESS.address) {
          rewardCount += 1;

          if (rewardCount > 1) {
            throw new Error('Too many reward transactions in block');
          }
        }
      }
    }
    return true;
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
