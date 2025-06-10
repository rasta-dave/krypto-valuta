import { Server } from 'socket.io';

const CHANNELS = {
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

export default class WebSocketServer {
  constructor({ blockchain, transactionPool, wallet }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.sockets = [];
  }

  listen(server) {
    this.io = new Server(server, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      allowEIO3: true,
    });

    this.io.on('connection', (socket) => {
      console.log(`WebSocket connection established: ${socket.id}`);
      this.sockets.push(socket);

      this.handleMessage(socket);

      socket.on('disconnect', (reason) => {
        console.log(`WebSocket disconnected: ${socket.id}, reason: ${reason}`);
        this.sockets = this.sockets.filter((s) => s.id !== socket.id);
        this.broadcastPeerDisconnected(socket.id);
      });

      socket.on('error', (error) => {
        console.error(`WebSocket error for ${socket.id}:`, error);
      });

      this.broadcastPeerConnected(socket.id);
    });
  }

  handleMessage(socket) {
    socket.on(CHANNELS.BLOCKCHAIN, (data) => {
      console.log('Received blockchain data:', data);
    });

    socket.on(CHANNELS.TRANSACTION, (data) => {
      console.log('Received transaction data:', data);
    });

    socket.on('request-blockchain', () => {
      socket.emit('blockchain-updated', {
        blockchain: this.blockchain.chain,
        latestBlock: this.blockchain.chain[this.blockchain.chain.length - 1],
      });
    });

    socket.on('request-transaction-pool', () => {
      socket.emit(
        'transaction-pool-updated',
        this.transactionPool.validTransactions()
      );
    });

    socket.on('broadcast-transaction', (transaction) => {
      this.broadcastTransaction(transaction);
    });

    socket.on('request-network-stats', () => {
      socket.emit('network-stats', {
        peers: this.sockets.length,
        difficulty:
          this.blockchain.chain[this.blockchain.chain.length - 1]?.difficulty ||
          1,
        hashRate: 0,
      });
    });
  }

  broadcastChain() {
    const latestBlock = this.blockchain.chain[this.blockchain.chain.length - 1];
    this.sockets.forEach((socket) => {
      socket.emit('blockchain-updated', {
        blockchain: this.blockchain.chain,
        latestBlock,
      });
    });
  }

  broadcastNewBlock(block) {
    this.sockets.forEach((socket) => {
      socket.emit('new-block', block);
    });
  }

  broadcastTransaction(transaction) {
    this.sockets.forEach((socket) => {
      socket.emit('new-transaction', transaction);
    });
  }

  broadcastTransactionPool() {
    this.sockets.forEach((socket) => {
      socket.emit(
        'transaction-pool-updated',
        this.transactionPool.validTransactions()
      );
    });
  }

  broadcastMiningStarted(miner) {
    this.sockets.forEach((socket) => {
      socket.emit('mining-started', { miner });
    });
  }

  broadcastMiningCompleted(data) {
    this.sockets.forEach((socket) => {
      socket.emit('mining-completed', data);
    });
  }

  broadcastPeerConnected(peerId) {
    this.sockets.forEach((socket) => {
      if (socket.id !== peerId) {
        socket.emit('peer-connected', peerId);
      }
    });
  }

  broadcastPeerDisconnected(peerId) {
    this.sockets.forEach((socket) => {
      socket.emit('peer-disconnected', peerId);
    });
  }

  syncWithPeers(rootNodeUrl) {
    console.log(`Syncing with root node: ${rootNodeUrl}`);
  }
}
