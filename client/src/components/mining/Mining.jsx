import React, { useState, useEffect } from 'react';
import { walletAPI, blockchainAPI } from '../../utils/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import {
  Hammer,
  Coins,
  Zap,
  Clock,
  TrendingUp,
  Hash,
  Activity,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Mining = () => {
  const [mining, setMining] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [miningStats, setMiningStats] = useState({
    totalMined: 0,
    totalRewards: 0,
    averageTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const { connected, latestBlock, transactionPool } = useWebSocket();

  useEffect(() => {
    fetchMiningData();
  }, []);

  const fetchMiningData = async () => {
    try {
      setLoading(true);
      const [walletResponse, statsResponse] = await Promise.all([
        walletAPI.getInfo(),
        blockchainAPI.getStats(),
      ]);

      setWalletData(walletResponse.data.data);
      setBlockchainStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error fetching mining data:', error);
      toast.error('Failed to load mining data');
    } finally {
      setLoading(false);
    }
  };

  const startMining = async () => {
    if (!connected) {
      toast.error('Please connect to the network first');
      return;
    }

    try {
      setMining(true);
      toast.success('Mining started...');

      const response = await walletAPI.mine();

      if (response.data.success) {
        toast.success(
          `Block mined successfully! Reward: ${response.data.data.reward} SC`
        );
        fetchMiningData();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Mining failed';
      toast.error(message);
    } finally {
      setMining(false);
    }
  };

  const MiningCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = 'primary',
  }) => {
    const colorClasses = {
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      secondary: 'bg-secondary-100 text-secondary-800',
    };

    return (
      <div className='card'>
        <div className='flex items-center'>
          <div className={`p-3 rounded-lg ${colorClasses[color]} mr-4`}>
            <Icon className='w-6 h-6' />
          </div>
          <div className='flex-1'>
            <p className='text-sm font-medium text-secondary-600'>{title}</p>
            <p className='text-2xl font-bold text-secondary-900'>{value}</p>
            {subtitle && (
              <p className='text-xs text-secondary-500 mt-1'>{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-64'>
        <div className='loading-spinner w-8 h-8'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-secondary-900'>Mining</h1>
          <p className='text-secondary-600'>
            Mine blocks and earn SmartChain rewards
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <div
            className={`w-3 h-3 rounded-full ${
              connected ? 'bg-success-500' : 'bg-error-500'
            }`}></div>
          <span className='text-sm text-secondary-600'>
            {connected ? 'Network Connected' : 'Network Disconnected'}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MiningCard
          icon={Coins}
          title='Current Balance'
          value={`${walletData?.balance || 0} SC`}
          subtitle='Available for mining'
          color='primary'
        />
        <MiningCard
          icon={Activity}
          title='Pending Transactions'
          value={transactionPool?.length || 0}
          subtitle='Ready to mine'
          color='warning'
        />
        <MiningCard
          icon={TrendingUp}
          title='Mining Difficulty'
          value={latestBlock?.difficulty || 0}
          subtitle='Current network difficulty'
          color='secondary'
        />
        <MiningCard
          icon={Trophy}
          title='Mining Reward'
          value='50 SC'
          subtitle='Per block mined'
          color='success'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Mining Control
            </h3>
          </div>

          <div className='space-y-6'>
            <div className='text-center'>
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  mining
                    ? 'bg-warning-100 text-warning-600 animate-pulse'
                    : 'bg-primary-100 text-primary-600'
                }`}>
                <Hammer
                  className={`w-10 h-10 ${mining ? 'animate-bounce' : ''}`}
                />
              </div>

              <div className='mb-6'>
                <div className='text-lg font-semibold text-secondary-900 mb-2'>
                  {mining ? 'Mining in Progress...' : 'Ready to Mine'}
                </div>
                <p className='text-secondary-600 text-sm'>
                  {mining
                    ? 'Your node is currently mining a new block'
                    : 'Click the button below to start mining'}
                </p>
              </div>

              <button
                onClick={startMining}
                disabled={mining || !connected}
                className={`btn-primary w-full py-3 ${
                  mining ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                {mining ? (
                  <div className='flex items-center justify-center'>
                    <div className='loading-spinner w-5 h-5 mr-2'></div>
                    Mining Block...
                  </div>
                ) : (
                  <div className='flex items-center justify-center'>
                    <Zap className='w-5 h-5 mr-2' />
                    Start Mining
                  </div>
                )}
              </button>
            </div>

            {!connected && (
              <div className='bg-warning-50 border border-warning-200 rounded-lg p-4'>
                <div className='flex items-center'>
                  <Hash className='w-5 h-5 text-warning-600 mr-2' />
                  <span className='text-sm text-warning-700'>
                    Connect to the network to start mining
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Latest Block Information
            </h3>
          </div>

          {latestBlock ? (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Block Hash</span>
                <div className='flex items-center space-x-2'>
                  <Hash className='w-4 h-4 text-secondary-400' />
                  <span className='font-mono text-sm'>
                    {latestBlock.hash.substring(0, 16)}...
                  </span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>
                  Previous Hash
                </span>
                <span className='font-mono text-sm text-secondary-500'>
                  {latestBlock.lastHash.substring(0, 16)}...
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Transactions</span>
                <span className='text-sm font-medium'>
                  {latestBlock.data?.length || 0}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Difficulty</span>
                <span className='text-sm font-medium'>
                  {latestBlock.difficulty}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Nonce</span>
                <span className='text-sm font-medium'>{latestBlock.nonce}</span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Timestamp</span>
                <div className='flex items-center space-x-2'>
                  <Clock className='w-4 h-4 text-secondary-400' />
                  <span className='text-sm'>
                    {new Date(latestBlock.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center py-8'>
              <Hash className='w-12 h-12 text-secondary-300 mx-auto mb-4' />
              <p className='text-secondary-500'>No blocks found</p>
            </div>
          )}
        </div>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-semibold text-secondary-900'>
            Mining Information
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-primary-600 mb-2'>
              50 SC
            </div>
            <div className='text-sm text-secondary-600'>Block Reward</div>
            <p className='text-xs text-secondary-500 mt-1'>
              Earned for each successful block
            </p>
          </div>

          <div className='text-center'>
            <div className='text-2xl font-bold text-success-600 mb-2'>
              ~{Math.max(1, latestBlock?.difficulty || 1)}min
            </div>
            <div className='text-sm text-secondary-600'>Est. Mining Time</div>
            <p className='text-xs text-secondary-500 mt-1'>
              Based on current difficulty
            </p>
          </div>

          <div className='text-center'>
            <div className='text-2xl font-bold text-warning-600 mb-2'>
              {blockchainStats?.totalBlocks || 0}
            </div>
            <div className='text-sm text-secondary-600'>Total Blocks</div>
            <p className='text-xs text-secondary-500 mt-1'>In the blockchain</p>
          </div>
        </div>

        <div className='mt-6 bg-secondary-50 rounded-lg p-4'>
          <h4 className='font-medium text-secondary-900 mb-2'>
            How Mining Works
          </h4>
          <ul className='text-sm text-secondary-600 space-y-1'>
            <li>• Mining creates new blocks containing pending transactions</li>
            <li>• Each successful block earns you 50 SC as a reward</li>
            <li>
              • Mining difficulty adjusts automatically based on network
              activity
            </li>
            <li>• You need to be connected to the network to participate</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Mining;
