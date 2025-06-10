import Blockchain from '../models/blockchain/blockchain.mjs';

export const getBlockchain = (req, res) => {
  const { blockchain } = req.app.locals;

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blockchain retrieved successfully',
    data: blockchain.chain,
  });
};

export const getBlocks = (req, res) => {
  const { blockchain } = req.app.locals;
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const blocks = blockchain.chain.slice().reverse().slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blocks retrieved successfully',
    data: {
      blocks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: blockchain.chain.length,
        pages: Math.ceil(blockchain.chain.length / limit),
      },
    },
  });
};

export const getBlock = (req, res) => {
  const { blockchain } = req.app.locals;
  const { hash } = req.params;
  const block = blockchain.chain.find((block) => block.hash === hash);

  if (!block) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: 'Block not found',
    });
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Block retrieved successfully',
    data: block,
  });
};

export const searchBlockchain = (req, res) => {
  const { blockchain } = req.app.locals;
  const { q: query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Search query is required',
    });
  }

  let foundBlock = null;
  let foundTransaction = null;

  foundBlock = blockchain.chain.find((block) => block.hash === query);

  if (!foundBlock) {
    for (const block of blockchain.chain) {
      if (block.data && Array.isArray(block.data)) {
        foundTransaction = block.data.find((tx) => tx.id === query);
        if (foundTransaction) break;
      }
    }
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Search completed',
    data: {
      block: foundBlock,
      transaction: foundTransaction,
    },
  });
};

export const getBlockchainLength = (req, res) => {
  const { blockchain } = req.app.locals;

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blockchain length retrieved successfully',
    data: { length: blockchain.chain.length },
  });
};

export const getStats = (req, res) => {
  const { blockchain } = req.app.locals;
  let totalTransactions = 0;

  blockchain.chain.forEach((block) => {
    if (block.data && Array.isArray(block.data)) {
      totalTransactions += block.data.length;
    }
  });

  const stats = {
    totalBlocks: blockchain.chain.length,
    totalTransactions,
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

export const resetBlockchain = async (req, res) => {
  try {
    const { blockchain } = req.app.locals;
    const BlockModel = (await import('../database/models/BlockModel.mjs'))
      .default;

    await BlockModel.deleteMany({});

    const Block = (await import('../models/blockchain/block.mjs')).default;
    blockchain.chain = [Block.genesis()];

    await blockchain.saveGenesisBlock();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Blockchain reset successfully',
      data: {
        blocks: blockchain.chain.length,
        chainValid: blockchain.validateFullChain(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error resetting blockchain',
    });
  }
};
