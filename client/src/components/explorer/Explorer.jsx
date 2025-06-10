import React, { useState, useEffect } from 'react';
import { blockchainAPI } from '../../utils/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import {
  Search,
  Hash,
  Clock,
  Layers,
  Activity,
  Database,
  Eye,
  ChevronRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Explorer = () => {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const { connected, latestBlock } = useWebSocket();

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  useEffect(() => {
    if (latestBlock) {
      setBlocks((prev) => [latestBlock, ...prev.slice(0, 9)]);
    }
  }, [latestBlock]);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      const [blocksResponse, statsResponse] = await Promise.all([
        blockchainAPI.getBlocks({ page: 1, limit: 10 }),
        blockchainAPI.getStats(),
      ]);

      setBlocks(blocksResponse.data.data.blocks);
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      toast.error('Failed to load blockchain data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const response = await blockchainAPI.search(searchQuery.trim());
      setSearchResults(response.data.data);

      if (!response.data.data.block && !response.data.data.transaction) {
        toast.error('No results found');
      }
    } catch (error) {
      toast.error('Search failed');
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const viewBlockDetails = async (blockHash) => {
    try {
      const response = await blockchainAPI.getBlock(blockHash);
      setSelectedBlock(response.data.data);
    } catch (error) {
      toast.error('Failed to load block details');
    }
  };

  const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 8)}`;
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
          <h1 className='text-3xl font-bold text-secondary-900'>
            Blockchain Explorer
          </h1>
          <p className='text-secondary-600'>
            Explore blocks, transactions, and network statistics
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
        <StatCard
          icon={Layers}
          title='Total Blocks'
          value={stats.totalBlocks || 0}
          subtitle='In the blockchain'
          color='primary'
        />
        <StatCard
          icon={Activity}
          title='Total Transactions'
          value={stats.totalTransactions || 0}
          subtitle='All-time'
          color='success'
        />
        <StatCard
          icon={TrendingUp}
          title='Network Difficulty'
          value={latestBlock?.difficulty || 0}
          subtitle='Current mining difficulty'
          color='warning'
        />
        <StatCard
          icon={Zap}
          title='Latest Block'
          value={`#${
            blocks[0]?.timestamp
              ? new Date(blocks[0].timestamp).toLocaleDateString()
              : 'N/A'
          }`}
          subtitle='Most recent'
          color='secondary'
        />
      </div>

      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-semibold text-secondary-900'>
            Search Blockchain
          </h3>
        </div>

        <form onSubmit={handleSearch} className='flex space-x-4'>
          <div className='flex-1'>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='input'
              placeholder='Enter block hash or transaction ID'
            />
          </div>
          <button
            type='submit'
            disabled={searchLoading}
            className='btn-primary'>
            {searchLoading ? (
              <div className='loading-spinner w-4 h-4'></div>
            ) : (
              <Search className='w-4 h-4' />
            )}
          </button>
        </form>

        {searchResults && (
          <div className='mt-4 space-y-4'>
            {searchResults.block && (
              <div className='bg-primary-50 border border-primary-200 rounded-lg p-4'>
                <h4 className='font-medium text-primary-900 mb-2'>
                  Block Found
                </h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-primary-700'>Hash:</span>
                    <span className='font-mono'>
                      {formatHash(searchResults.block.hash)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-primary-700'>Transactions:</span>
                    <span>{searchResults.block.data?.length || 0}</span>
                  </div>
                  <button
                    onClick={() => viewBlockDetails(searchResults.block.hash)}
                    className='btn-outline text-xs mt-2'>
                    View Details
                  </button>
                </div>
              </div>
            )}

            {searchResults.transaction && (
              <div className='bg-success-50 border border-success-200 rounded-lg p-4'>
                <h4 className='font-medium text-success-900 mb-2'>
                  Transaction Found
                </h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-success-700'>ID:</span>
                    <span className='font-mono'>
                      {formatHash(searchResults.transaction.id)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-success-700'>From:</span>
                    <span className='font-mono'>
                      {formatHash(searchResults.transaction.input.address)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Recent Blocks
            </h3>
          </div>

          {blocks.length > 0 ? (
            <div className='space-y-3'>
              {blocks.map((block, index) => (
                <div
                  key={block.hash}
                  className='flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors cursor-pointer'
                  onClick={() => viewBlockDetails(block.hash)}>
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 bg-primary-100 text-primary-600 rounded-lg'>
                      <Database className='w-4 h-4' />
                    </div>
                    <div>
                      <div className='font-medium text-secondary-900'>
                        Block #{index + 1}
                      </div>
                      <div className='text-sm text-secondary-600 font-mono'>
                        {formatHash(block.hash)}
                      </div>
                      <div className='text-xs text-secondary-500 flex items-center mt-1'>
                        <Clock className='w-3 h-3 mr-1' />
                        {new Date(block.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4'>
                    <div className='text-right'>
                      <div className='text-sm font-medium text-secondary-900'>
                        {block.data?.length || 0} TXs
                      </div>
                      <div className='text-xs text-secondary-500'>
                        Difficulty: {block.difficulty}
                      </div>
                    </div>
                    <ChevronRight className='w-4 h-4 text-secondary-400' />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8'>
              <Database className='w-12 h-12 text-secondary-300 mx-auto mb-4' />
              <p className='text-secondary-500'>No blocks found</p>
            </div>
          )}
        </div>

        {selectedBlock && (
          <div className='card'>
            <div className='card-header'>
              <h3 className='text-lg font-semibold text-secondary-900'>
                Block Details
              </h3>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-secondary-600'>
                  Hash
                </label>
                <div className='font-mono text-sm text-secondary-900 bg-secondary-50 p-2 rounded mt-1 break-all'>
                  {selectedBlock.hash}
                </div>
              </div>

              <div>
                <label className='text-sm font-medium text-secondary-600'>
                  Previous Hash
                </label>
                <div className='font-mono text-sm text-secondary-900 bg-secondary-50 p-2 rounded mt-1 break-all'>
                  {selectedBlock.lastHash}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-secondary-600'>
                    Timestamp
                  </label>
                  <div className='text-sm text-secondary-900 mt-1'>
                    {new Date(selectedBlock.timestamp).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-secondary-600'>
                    Nonce
                  </label>
                  <div className='text-sm text-secondary-900 mt-1'>
                    {selectedBlock.nonce}
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-secondary-600'>
                    Difficulty
                  </label>
                  <div className='text-sm text-secondary-900 mt-1'>
                    {selectedBlock.difficulty}
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-secondary-600'>
                    Transactions
                  </label>
                  <div className='text-sm text-secondary-900 mt-1'>
                    {selectedBlock.data?.length || 0}
                  </div>
                </div>
              </div>

              {selectedBlock.data && selectedBlock.data.length > 0 && (
                <div>
                  <label className='text-sm font-medium text-secondary-600 mb-2 block'>
                    Transactions in Block
                  </label>
                  <div className='space-y-2 max-h-64 overflow-y-auto'>
                    {selectedBlock.data.map((transaction, index) => (
                      <div
                        key={index}
                        className='bg-secondary-50 p-3 rounded text-sm'>
                        <div className='font-mono text-xs text-secondary-600 mb-1'>
                          ID: {transaction.id}
                        </div>
                        <div className='flex justify-between'>
                          <span>
                            From: {formatHash(transaction.input.address)}
                          </span>
                          <span>Amount: {transaction.input.amount} SC</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
