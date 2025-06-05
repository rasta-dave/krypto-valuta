import BlockModel from './models/BlockModel.mjs';
import BlockchainModel from './models/BlockchainModel.mjs';

export class BlockchainService {
  static async getBlockchain() {
    try {
      const blocks = await BlockModel.find().sort({ blockIndex: 1 });
      return blocks.map((block) => ({
        timestamp: block.timestamp,
        lastHash: block.lastHash,
        hash: block.hash,
        data: block.data,
        nonce: block.nonce,
        difficulty: block.difficulty,
      }));
    } catch (error) {
      console.error('Error retrieving blockchain from database:', error);
      return [];
    }
  }

  static async saveBlock(blockData, blockIndex) {
    try {
      const existingBlock = await BlockModel.findOne({ hash: blockData.hash });
      if (existingBlock) {
        return existingBlock;
      }

      const block = new BlockModel({
        timestamp: blockData.timestamp,
        lastHash: blockData.lastHash,
        hash: blockData.hash,
        data: blockData.data,
        nonce: blockData.nonce,
        difficulty: blockData.difficulty,
        blockIndex: blockIndex,
      });

      const savedBlock = await block.save();

      await this.updateBlockchainMetadata(blockData.hash, blockIndex);

      return savedBlock;
    } catch (error) {
      console.error('Error saving block to database:', error);
      throw error;
    }
  }

  static async updateBlockchainMetadata(latestBlockHash, blockIndex) {
    try {
      await BlockchainModel.findOneAndUpdate(
        { name: 'SmartChain' },
        {
          latestBlockHash: latestBlockHash,
          blockCount: blockIndex + 1,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating blockchain metadata:', error);
    }
  }
}
