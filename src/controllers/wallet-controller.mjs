import Wallet from '../models/wallet/wallet.mjs';
import Transaction from '../models/wallet/transaction.mjs';
import Blockchain from '../models/blockchain/blockchain.mjs';
import Miner from '../models/miner/miner.mjs';
import UserModel from '../database/models/UserModel.mjs';

export const getWalletInfo = async (req, res) => {
  try {
    const { blockchain } = req.app.locals;
    let userAddress = req.user.walletAddress;

    if (!userAddress) {
      const wallet = new Wallet();
      userAddress = wallet.publicKey;

      await UserModel.findByIdAndUpdate(req.user._id, {
        walletAddress: userAddress,
      });

      req.user.walletAddress = userAddress;
    }

    const walletInfo = {
      address: userAddress,
      balance: Wallet.calculateBalance({
        chain: blockchain.chain,
        address: userAddress,
      }),
      publicKey: userAddress,
    };

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Wallet info retrieved successfully',
      data: walletInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error retrieving wallet info',
    });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { blockchain, transactionPool } = req.app.locals;
    const { recipient, amount } = req.body;

    if (!recipient || !amount) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Recipient and amount are required',
      });
    }

    const senderWallet = new Wallet();
    senderWallet.publicKey = req.user.walletAddress;

    const transaction = Transaction.createTransaction({
      senderWallet,
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

    transactionPool.setTransaction(transaction, blockchain.chain);

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

export const getMyTransactions = async (req, res) => {
  try {
    const { blockchain } = req.app.locals;
    const { page = 1, limit = 10 } = req.query;
    let userAddress = req.user.walletAddress;

    if (!userAddress) {
      const wallet = new Wallet();
      userAddress = wallet.publicKey;

      await UserModel.findByIdAndUpdate(req.user._id, {
        walletAddress: userAddress,
      });

      req.user.walletAddress = userAddress;
    }

    const allTransactions = [];

    for (let i = 1; i < blockchain.chain.length; i++) {
      const block = blockchain.chain[i];

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
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allTransactions.length / limit);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Transactions retrieved successfully',
      data: {
        transactions: paginatedTransactions,
        total: allTransactions.length,
        totalPages,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext: endIndex < allTransactions.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || 'Error retrieving transactions',
    });
  }
};

export const mineBlock = async (req, res) => {
  try {
    const { blockchain } = req.app.locals;
    const userAddress = req.user.walletAddress;

    const minerWallet = new Wallet();
    minerWallet.publicKey = userAddress;

    const rewardTransaction = Transaction.createRewardTransaction({
      minerWallet,
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
          address: userAddress,
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
  const { blockchain } = req.app.locals;
  const userAddress = req.user.walletAddress;

  const balance = Wallet.calculateBalance({
    chain: blockchain.chain,
    address: userAddress,
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Balance retrieved successfully',
    data: { balance },
  });
};
