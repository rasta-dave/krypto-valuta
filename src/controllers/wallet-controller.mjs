import Wallet from '../models/wallet/wallet.mjs';
import Transaction from '../models/wallet/transaction.mjs';
import Blockchain from '../models/blockchain/blockchain.mjs';
import Miner from '../models/miner/miner.mjs';

let blockchain;
let wallet;
let miner;

const initializeInstances = () => {
  if (!blockchain) {
    blockchain = new Blockchain();
    wallet = new Wallet();
    miner = new Miner({
      blockchain,
      transactionPool: null,
      wallet,
      pubsub: null,
    });
  }
};

export const getWalletInfo = (req, res) => {
  initializeInstances();

  const walletInfo = {
    address: wallet.publicKey,
    balance: Wallet.calculateBalance({
      chain: blockchain.chain,
      address: wallet.publicKey,
    }),
    publicKey: wallet.publicKey,
  };

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Wallet info retrieved successfully',
    data: walletInfo,
  });
};

export const createTransaction = async (req, res) => {
  try {
    initializeInstances();

    const { recipient, amount } = req.body;

    if (!recipient || !amount) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Recipient and amount are required',
      });
    }

    const transaction = Transaction.createTransaction({
      senderWallet: wallet,
      recipient,
      amount: parseFloat(amount),
    });

    if (!transaction) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Insufficient funds',
      });
    }

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error creating transaction',
    });
  }
};

export const getMyTransactions = (req, res) => {
  initializeInstances();

  const { page = 1, limit = 10 } = req.query;
  const userAddress = wallet.publicKey;

  const allTransactions = [];
  blockchain.chain.forEach((block) => {
    if (block.data && Array.isArray(block.data)) {
      block.data.forEach((transaction) => {
        if (
          transaction.input?.address === userAddress ||
          (transaction.outputMap &&
            Object.keys(transaction.outputMap).includes(userAddress))
        ) {
          allTransactions.push({
            ...transaction,
            blockHash: block.hash,
            timestamp: block.timestamp,
          });
        }
      });
    }
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Transactions retrieved successfully',
    data: {
      transactions: paginatedTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allTransactions.length / limit),
        totalTransactions: allTransactions.length,
        hasNext: endIndex < allTransactions.length,
        hasPrev: page > 1,
      },
    },
  });
};

export const mineBlock = async (req, res) => {
  try {
    initializeInstances();

    const rewardTransaction = Transaction.createRewardTransaction({
      minerWallet: wallet,
    });

    const block = await blockchain.addBlock({ data: [rewardTransaction] });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Block mined successfully',
      data: {
        block,
        reward: 50,
        newBalance: Wallet.calculateBalance({
          chain: blockchain.chain,
          address: wallet.publicKey,
        }),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error mining block',
    });
  }
};

export const getBalance = (req, res) => {
  initializeInstances();

  const balance = Wallet.calculateBalance({
    chain: blockchain.chain,
    address: wallet.publicKey,
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Balance retrieved successfully',
    data: { balance },
  });
};
