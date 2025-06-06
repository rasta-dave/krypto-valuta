import Miner from '../models/miner/Miner.mjs';
import Wallet from '../models/wallet/Wallet.mjs';
import UserModel from '../database/models/UserModel.mjs';

export const addTransaction = async (req, res) => {
  try {
    const { amount, recipient } = req.body;
    const { transactionPool, wallet, networkServer, blockchain } =
      req.app.locals;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required to create transactions',
      });
    }

    let userWallet = wallet;

    const user = await UserModel.findById(userId);
    if (user.walletAddress) {
      userWallet.publicKey = user.walletAddress;
    } else {
      user.walletAddress = wallet.publicKey;
      await user.save();
    }

    let transaction = transactionPool.transactionExists({
      address: userWallet.publicKey,
    });

    if (transaction) {
      transaction.update({ sender: userWallet, recipient, amount });
    } else {
      transaction = userWallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain,
      });
    }

    transactionPool.addTransaction(transaction);
    networkServer.broadcastTransaction(transaction);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Transaction created successfully',
      data: {
        transaction,
        user: {
          id: user._id,
          username: user.username,
          walletAddress: user.walletAddress,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: error.message,
    });
  }
};

export const getWalletInfo = async (req, res) => {
  try {
    const { wallet, blockchain } = req.app.locals;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    let userWalletAddress = user.walletAddress || wallet.publicKey;

    if (!user.walletAddress) {
      user.walletAddress = wallet.publicKey;
      await user.save();
      userWalletAddress = wallet.publicKey;
    }

    const balance = Wallet.calculateBalance({
      chain: blockchain.chain,
      address: userWalletAddress,
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        wallet: {
          address: userWalletAddress,
          balance: balance,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: error.message,
    });
  }
};

export const getUserTransactions = async (req, res) => {
  try {
    const { transactionPool, blockchain } = req.app.locals;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    const userWalletAddress = user.walletAddress;

    if (!userWalletAddress) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User has no wallet address',
      });
    }

    const userTransactions = [];

    Object.values(transactionPool.transactionMap).forEach((transaction) => {
      if (
        transaction.input.address === userWalletAddress ||
        transaction.outputMap[userWalletAddress]
      ) {
        userTransactions.push(transaction);
      }
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        transactions: userTransactions,
        count: userTransactions.length,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: error.message,
    });
  }
};

export const listAllTransactions = async (req, res) => {
  try {
    const { transactionPool } = req.app.locals;

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: transactionPool.transactionMap,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: error.message,
    });
  }
};

export const mineTransactions = async (req, res) => {
  try {
    const { transactionPool, wallet, blockchain, networkServer } =
      req.app.locals;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);

    let minerWallet = wallet;
    if (user.walletAddress) {
      minerWallet.publicKey = user.walletAddress;
    } else {
      user.walletAddress = wallet.publicKey;
      await user.save();
    }

    const miner = new Miner({
      transactionPool: transactionPool,
      wallet: minerWallet,
      blockchain: blockchain,
      networkServer: networkServer,
    });

    miner.mineTransactions();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Block mined successfully',
      data: {
        miner: {
          id: user._id,
          username: user.username,
          walletAddress: user.walletAddress,
        },
        latestBlock: blockchain.chain.at(-1),
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: error.message,
    });
  }
};
