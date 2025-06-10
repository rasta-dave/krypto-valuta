import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext({});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [blockchainData, setBlockchainData] = useState(null);
  const [transactionPool, setTransactionPool] = useState([]);
  const [latestBlock, setLatestBlock] = useState(null);
  const [networkStats, setNetworkStats] = useState({
    peers: 0,
    difficulty: 0,
    hashRate: 0,
  });

  const { isAuthenticated } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        try {
          connectSocket();
        } catch (error) {
          console.error('WebSocket connection failed:', error);
        }
      }, 1000);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  const connectSocket = () => {
    if (socket?.connected) return;

    try {
      let socketUrl = '/';
      if (window.location.hostname === 'localhost') {
        socketUrl = 'http://localhost:3000';
      }

      const newSocket = io(socketUrl, {
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 60000,
        forceNew: false,
      });

      newSocket.on('connect', () => {
        setConnected(true);
        reconnectAttempts.current = 0;
        console.log('WebSocket connected successfully');
      });

      newSocket.on('disconnect', (reason) => {
        setConnected(false);
        console.log('WebSocket disconnected, reason:', reason);
        if (reason === 'io server disconnect') {
          console.log(
            'Server disconnected the socket, attempting to reconnect...'
          );
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reconnectAttempts.current++;

        if (reconnectAttempts.current >= 3) {
          console.log(
            'WebSocket connection failed, continuing without realtime features'
          );
        }
      });

      newSocket.on('blockchain-updated', (data) => {
        setBlockchainData(data.blockchain);
        setLatestBlock(data.latestBlock);
        toast.success('Blockchain updated!');
      });

      newSocket.on('new-block', (block) => {
        setLatestBlock(block);
        toast.success(`New block mined: ${block.hash.substring(0, 8)}...`);
      });

      newSocket.on('new-transaction', (transaction) => {
        setTransactionPool((prev) => [...prev, transaction]);
        toast.success('New transaction added to pool');
      });

      newSocket.on('transaction-pool-updated', (pool) => {
        setTransactionPool(pool);
      });

      newSocket.on('mining-started', (data) => {
        toast.success(`Mining started by ${data.miner.substring(0, 8)}...`);
      });

      newSocket.on('mining-completed', (data) => {
        toast.success(`Block mined! Reward: ${data.reward} SC`);
      });

      newSocket.on('network-stats', (stats) => {
        setNetworkStats(stats);
      });

      newSocket.on('peer-connected', (peer) => {
        console.log('New peer connected:', peer);
      });

      newSocket.on('peer-disconnected', (peer) => {
        console.log('Peer disconnected:', peer);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  };

  const requestBlockchainData = () => {
    if (socket?.connected) {
      socket.emit('request-blockchain');
    }
  };

  const requestTransactionPool = () => {
    if (socket?.connected) {
      socket.emit('request-transaction-pool');
    }
  };

  const broadcastTransaction = (transaction) => {
    if (socket?.connected) {
      socket.emit('broadcast-transaction', transaction);
    }
  };

  const requestNetworkStats = () => {
    if (socket?.connected) {
      socket.emit('request-network-stats');
    }
  };

  const value = {
    socket,
    connected,
    blockchainData,
    transactionPool,
    latestBlock,
    networkStats,
    connectSocket,
    disconnectSocket,
    requestBlockchainData,
    requestTransactionPool,
    broadcastTransaction,
    requestNetworkStats,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
