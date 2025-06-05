import Miner from '../models/miner/miner.mjs';
import Wallet from '../models/wallet/wallet.mjs';

export const addTransaction = (req, res) => {
  const { amount, recipient } = req.body;
  const { transactionPool, wallet, networkServer, blockchain } = req.app.locals;

  let transaction = transactionPool.transactionExists({
    address: wallet.publicKey,
  });

  try {
    if (transaction) {
      transaction.update({ sender: wallet, recipient, amount });
    } else {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain,
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      error: error.message,
    });
  }

  transactionPool.addTransaction(transaction);
  networkServer.broadcastTransaction(transaction);

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: transaction,
  });
};

export const getWalletInfo = (req, res) => {
  const { wallet, blockchain } = req.app.locals;

  const address = wallet.publicKey;
  const balance = Wallet.calculateBalance({
    chain: blockchain.chain,
    address: address,
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      address: address,
      balance: balance,
    },
  });
};

export const listAllTransactions = (req, res) => {
  const { transactionPool } = req.app.locals;

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: transactionPool.transactionMap,
  });
};

export const mineTransactions = (req, res) => {
  const { transactionPool, wallet, blockchain, networkServer } = req.app.locals;

  const miner = new Miner({
    transactionPool: transactionPool,
    wallet: wallet,
    blockchain: blockchain,
    networkServer: networkServer,
  });

  miner.mineTransactions();

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: 'Block mined successfully',
  });
};
