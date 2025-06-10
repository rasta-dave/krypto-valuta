import { createServer } from 'http';
import { app, notFound, errorHandler } from './app.mjs';
import authRoutes from './routes/auth-routes.mjs';
import blockchainRoutes from './routes/blockchain-routes.mjs';
import walletRoutes from './routes/wallet-routes.mjs';
import transactionRoutes from './routes/transaction-routes.mjs';
import WebSocketServer from './network/WebSocketServer.mjs';
import Blockchain from './models/blockchain/blockchain.mjs';
import TransactionPool from './models/wallet/transactionPool.mjs';
import Wallet from './models/wallet/wallet.mjs';
import { connectDB } from './database/connection.mjs';

const initializeServer = async () => {
  try {
    await connectDB();

    const blockchain = new Blockchain();
    await blockchain.initializeFromDatabase();

    const transactionPool = new TransactionPool();
    const wallet = new Wallet();

    const networkServer = new WebSocketServer({
      blockchain,
      transactionPool,
      wallet,
    });

    app.locals.blockchain = blockchain;
    app.locals.transactionPool = transactionPool;
    app.locals.wallet = wallet;
    app.locals.networkServer = networkServer;

    app.get('/api/health', (req, res) => {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'SmartChain API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/blocks', blockchainRoutes);
    app.use('/api/wallet', walletRoutes);
    app.use('/api/transactions', transactionRoutes);

    app.use(notFound);
    app.use(errorHandler);

    const DEFAULT_PORT = 3000;
    const ROOT_NODE = `http://localhost:${DEFAULT_PORT}`;
    let NODE_PORT;

    if (process.env.GENERATE_NODE_PORT === 'true') {
      NODE_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
    }

    const PORT = NODE_PORT || DEFAULT_PORT;

    const server = createServer(app);
    networkServer.listen(server);

    server.listen(PORT, () => {
      console.log(`SmartChain server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`WebSocket server active for blockchain network`);
      console.log(`MongoDB integration active`);
      console.log(`JWT Authentication system active`);
      console.log(`Security middleware active`);
      console.log(
        `Health check available at: http://localhost:${PORT}/api/health`
      );

      if (PORT !== DEFAULT_PORT) {
        networkServer.syncWithPeers(ROOT_NODE);
      }
    });

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

initializeServer();
