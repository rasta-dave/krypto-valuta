import { Server } from 'socket.io';
import { createServer } from 'http';

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
        origin: '*',
        methodds: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`WebSocket connection established: ${socket.id}`);
      this.sockets.push(socket);

      this.handleMessage(socket);

      socket.on('disconnect', () => {
        console.log(`WebSocket disconnected: ${socket.id}`);
        this.sockets = this.sockets.filter((s) => s.id !== socket.id);
      });
    });
  }
}
