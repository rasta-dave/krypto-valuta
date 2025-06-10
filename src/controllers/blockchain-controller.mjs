import Blockchain from '../models/blockchain/blockchain.mjs';

const blockchain = new Blockchain();

export const getBlockchain = (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blockchain retrieved successfully',
    data: blockchain.chain,
  });
};

export const getBlockchainLength = (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blockchain length retrieved successfully',
    data: { length: blockchain.chain.length },
  });
};

export const getStats = (req, res) => {
  const stats = {
    totalBlocks: blockchain.chain.length,
    chainValid: blockchain.validateFullChain(),
    difficulty: blockchain.chain[blockchain.chain.length - 1]?.difficulty || 0,
    latestBlock: blockchain.chain[blockchain.chain.length - 1],
  };

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blockchain stats retrieved successfully',
    data: stats,
  });
};
