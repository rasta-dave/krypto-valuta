import Transaction from '../models/wallet/transaction.mjs';
import Wallet from '../models/wallet/wallet.mjs';
import Miner from '../models/miner/miner.mjs';
import { asyncHandler } from '../middleware/errorMiddleware.mjs';
import { TransactionValidator } from '../utilities/transactionValidator.mjs';

export const addTransaction = asyncHandler(async (req, res) => {
  const { amount, recipient } = req.body;
  const { blockchain, transactionPool, networkServer } = req.app.locals;

  const senderWallet = new Wallet();
  senderWallet.publicKey = req.user.walletAddress;

  try {
    const transaction = Transaction.createTransaction({
      senderWallet,
      recipient,
      amount,
    });

    transactionPool.setTransaction(transaction, blockchain.chain);

    if (networkServer) {
      networkServer.broadcastTransaction(transaction);
    }

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Transaction added successfully',
      data: {
        transaction,
        poolSize: transactionPool.getTransactionCount(),
        validTransactions: transactionPool.validTransactions().length,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message,
    });
  }
});

export const mineTransactions = asyncHandler(async (req, res) => {
  const { blockchain, transactionPool, networkServer } = req.app.locals;

  const minerWallet = new Wallet();
  minerWallet.publicKey = req.user.walletAddress;

  const miner = new Miner({
    blockchain,
    transactionPool,
    wallet: minerWallet,
    pubsub: networkServer,
  });

  try {
    const miningResult = await miner.mineTransactions();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Block mined successfully',
      data: {
        block: miningResult.block,
        reward: miningResult.rewardAmount,
        stats: miningResult.stats,
      },
    });
  } catch (error) {
    if (error.message.includes('No valid transactions')) {
      const quickMineResult = await miner.quickMine();

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Empty block mined successfully (no transactions in pool)',
        data: {
          block: quickMineResult.block,
          reward: quickMineResult.rewardAmount,
          stats: quickMineResult.stats,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: error.message,
      });
    }
  }
});

export const getWalletInfo = asyncHandler(async (req, res) => {
  const { blockchain, transactionPool } = req.app.locals;
  const address = req.user.walletAddress;

  const wallet = new Wallet();
  wallet.publicKey = address;

  const balance = wallet.calculateBalance({ chain: blockchain.chain });
  const transactions = transactionPool.getTransactionsByAddress(address);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Wallet information retrieved successfully',
    data: {
      address,
      balance,
      pendingTransactions: transactions.length,
      transactions: transactions.slice(0, 10),
    },
  });
});

export const getUserTransactions = asyncHandler(async (req, res) => {
  const { blockchain } = req.app.locals;
  const address = req.user.walletAddress;
  const { page = 1, limit = 10 } = req.query;

  const userTransactions = [];

  for (let i = 1; i < blockchain.chain.length; i++) {
    const block = blockchain.chain[i];

    for (let transaction of block.data) {
      if (
        transaction.input.address === address ||
        transaction.outputMap[address]
      ) {
        userTransactions.push({
          ...transaction,
          blockIndex: i,
          blockHash: block.hash,
          timestamp: block.timestamp,
        });
      }
    }
  }

  userTransactions.sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedTransactions = userTransactions.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'User transactions retrieved successfully',
    data: {
      transactions: paginatedTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userTransactions.length / limit),
        totalTransactions: userTransactions.length,
        hasNextPage: endIndex < userTransactions.length,
        hasPrevPage: page > 1,
      },
    },
  });
});

export const listAllTransactions = asyncHandler(async (req, res) => {
  const { blockchain, transactionPool } = req.app.locals;
  const { page = 1, limit = 20, includePool = false } = req.query;

  const allTransactions = [];

  for (let i = 1; i < blockchain.chain.length; i++) {
    const block = blockchain.chain[i];

    for (let transaction of block.data) {
      allTransactions.push({
        ...transaction,
        blockIndex: i,
        blockHash: block.hash,
        timestamp: block.timestamp,
        status: 'confirmed',
      });
    }
  }

  if (includePool === 'true') {
    const poolTransactions = Object.values(transactionPool.transactionMap).map(
      (tx) => ({
        ...tx,
        status: 'pending',
        blockIndex: null,
        blockHash: null,
      })
    );
    allTransactions.push(...poolTransactions);
  }

  allTransactions.sort(
    (a, b) =>
      new Date(b.timestamp || b.input?.timestamp) -
      new Date(a.timestamp || a.input?.timestamp)
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

  const validationStats = {
    totalTransactions: allTransactions.length,
    confirmedTransactions: allTransactions.filter(
      (tx) => tx.status === 'confirmed'
    ).length,
    pendingTransactions: allTransactions.filter((tx) => tx.status === 'pending')
      .length,
    poolValidTransactions: transactionPool.validTransactions().length,
  };

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'All transactions retrieved successfully',
    data: {
      transactions: paginatedTransactions,
      stats: validationStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allTransactions.length / limit),
        totalTransactions: allTransactions.length,
        hasNextPage: endIndex < allTransactions.length,
        hasPrevPage: page > 1,
      },
    },
  });
});
