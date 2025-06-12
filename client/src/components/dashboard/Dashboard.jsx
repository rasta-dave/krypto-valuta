import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { walletAPI, blockchainAPI } from '../../utils/api';
import {
  Wallet as WalletIcon,
  Coins,
  Blocks,
  Activity,
  Users,
  TrendingUp,
  Clock,
  Hash,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { connected, latestBlock, networkStats } = useWebSocket();
  const [walletData, setWalletData] = useState(null);
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userTransactions, setUserTransactions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        walletResponse,
        statsResponse,
        transactionsResponse,
        blocksResponse,
      ] = await Promise.all([
        walletAPI.getInfo(),
        blockchainAPI.getStats(),
        walletAPI.getTransactions({ page: 1, limit: 100 }),
        blockchainAPI.getBlocks({ page: 1, limit: 1 }),
      ]);

      setWalletData(walletResponse.data.data);
      setBlockchainStats(statsResponse.data.data);
      setUserTransactions(transactionsResponse.data.data.transactions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserBlocksMined = () => {
    if (!userTransactions || !walletData) {
      return 0;
    }

    const rewardTransactions = userTransactions.filter((tx) => {
      const isReward = tx.input?.address === '*reward-address*';
      const hasOutput = tx.outputMap && tx.outputMap[walletData.address];
      return isReward && hasOutput;
    });

    return rewardTransactions.length;
  };

  const StatCard = ({
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
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center'>
              <div className={`p-2 rounded-lg ${colorClasses[color]} mr-3`}>
                <Icon className='w-5 h-5' />
              </div>
              <div>
                <p className='text-sm font-medium text-secondary-600'>
                  {title}
                </p>
                <p className='text-2xl font-bold text-secondary-900'>{value}</p>
                {subtitle && (
                  <p className='text-xs text-secondary-500 mt-1'>{subtitle}</p>
                )}
              </div>
            </div>
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

  const statCards = [
    {
      title: 'Wallet Balance',
      value: `${walletData?.balance || 0} SC`,
      icon: WalletIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      title: 'Transactions',
      value: userTransactions?.length || 0,
      icon: Activity,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      title: 'Blocks Mined',
      value: getUserBlocksMined(),
      icon: TrendingUp,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      title: 'Network Peers',
      value: networkStats?.peers || 0,
      icon: Users,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-secondary-900'>
            Welcome back, {user?.username}!
          </h1>
          <p className='text-secondary-600'>
            Here's what's happening on your SmartChain network
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
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className='card'>
              <div className='flex items-center'>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-secondary-600'>
                    {stat.title}
                  </p>
                  <p className='text-2xl font-bold text-secondary-900'>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Latest Block
            </h3>
          </div>
          {latestBlock || blockchainStats?.latestBlock ? (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Block Hash</span>
                <div className='flex items-center space-x-2'>
                  <Hash className='w-4 h-4 text-secondary-400' />
                  <span className='font-mono text-sm'>
                    {(
                      latestBlock?.hash || blockchainStats?.latestBlock?.hash
                    )?.substring(0, 16)}
                    ...
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Transactions</span>
                <span className='text-sm font-medium'>
                  {latestBlock?.data?.length ||
                    blockchainStats?.latestBlock?.data?.length ||
                    0}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Difficulty</span>
                <span className='text-sm font-medium'>
                  {latestBlock?.difficulty ||
                    blockchainStats?.latestBlock?.difficulty ||
                    blockchainStats?.difficulty ||
                    0}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-secondary-600'>Timestamp</span>
                <div className='flex items-center space-x-2'>
                  <Clock className='w-4 h-4 text-secondary-400' />
                  <span className='text-sm'>
                    {new Date(
                      latestBlock?.timestamp ||
                        blockchainStats?.latestBlock?.timestamp ||
                        Date.now()
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center py-8'>
              <Blocks className='w-12 h-12 text-secondary-300 mx-auto mb-4' />
              <p className='text-secondary-500'>No blocks found</p>
            </div>
          )}
        </div>

        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Network Statistics
            </h3>
          </div>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Users className='w-4 h-4 text-secondary-400' />
                <span className='text-sm text-secondary-600'>
                  Network Peers
                </span>
              </div>
              <span className='text-sm font-medium'>
                {networkStats?.peers || 0}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <TrendingUp className='w-4 h-4 text-secondary-400' />
                <span className='text-sm text-secondary-600'>
                  Mining Difficulty
                </span>
              </div>
              <span className='text-sm font-medium'>
                {networkStats?.difficulty || blockchainStats?.difficulty || 0}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Activity className='w-4 h-4 text-secondary-400' />
                <span className='text-sm text-secondary-600'>Hash Rate</span>
              </div>
              <span className='text-sm font-medium'>
                {networkStats?.hashRate || 0} H/s
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Blocks className='w-4 h-4 text-secondary-400' />
                <span className='text-sm text-secondary-600'>Chain Valid</span>
              </div>
              <span
                className={`text-sm font-medium ${
                  blockchainStats?.chainValid
                    ? 'text-success-600'
                    : 'text-error-600'
                }`}>
                {blockchainStats?.chainValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-semibold text-secondary-900'>
            Your Wallet Address
          </h3>
        </div>
        <div className='bg-secondary-50 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <WalletIcon className='w-5 h-5 text-secondary-400' />
              <span className='font-mono text-sm text-secondary-700'>
                {walletData?.address || 'Loading...'}
              </span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(walletData?.address)}
              className='btn-secondary text-xs'>
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
