import React, { useState, useEffect } from 'react';
import { walletAPI } from '../../utils/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Hash,
  Eye,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const { broadcastTransaction } = useWebSocket();

  useEffect(() => {
    fetchTransactions();
    fetchWalletData();
  }, [pagination.page]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, filter, dateRange]);

  const fetchWalletData = async () => {
    try {
      const response = await walletAPI.getInfo();
      setWalletData(response.data.data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getTransactions({
        page: pagination.page,
        limit: pagination.limit,
      });

      const data = response.data.data;
      setTransactions(data.transactions);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (tx) =>
          tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.input.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          Object.keys(tx.outputMap).some((addr) =>
            addr.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (filter !== 'all' && walletData) {
      filtered = filtered.filter((tx) => {
        const type = getTransactionType(tx, walletData.address);
        return type === filter;
      });
    }

    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.input.timestamp);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;

        if (fromDate && txDate < fromDate) return false;
        if (toDate && txDate > toDate) return false;
        return true;
      });
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionType = (transaction, userAddress) => {
    if (transaction.input.address === userAddress) {
      return 'sent';
    }
    return 'received';
  };

  const getTransactionAmount = (transaction, userAddress) => {
    const type = getTransactionType(transaction, userAddress);

    if (type === 'sent') {
      return (
        Object.values(transaction.outputMap).reduce(
          (sum, val) => sum + val,
          0
        ) - (transaction.outputMap[userAddress] || 0)
      );
    }
    return transaction.outputMap[userAddress] || 0;
  };

  const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 8)}`;
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'From', 'To', 'Transaction ID'],
      ...filteredTransactions.map((tx) => {
        const type = getTransactionType(tx, walletData.address);
        const amount = getTransactionAmount(tx, walletData.address);
        const recipient = Object.keys(tx.outputMap).find(
          (addr) => addr !== walletData.address
        );

        return [
          new Date(tx.input.timestamp).toLocaleString(),
          type,
          `${amount} SC`,
          tx.input.address,
          recipient || 'N/A',
          tx.id,
        ];
      }),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully');
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const TransactionCard = ({ transaction }) => {
    const type = getTransactionType(transaction, walletData.address);
    const amount = getTransactionAmount(transaction, walletData.address);
    const recipient = Object.keys(transaction.outputMap).find(
      (addr) => addr !== walletData.address
    );

    return (
      <div className='flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors'>
        <div className='flex items-center space-x-4'>
          <div
            className={`p-3 rounded-full ${
              type === 'sent'
                ? 'bg-error-100 text-error-600'
                : 'bg-success-100 text-success-600'
            }`}>
            {type === 'sent' ? (
              <ArrowUpRight className='w-5 h-5' />
            ) : (
              <ArrowDownLeft className='w-5 h-5' />
            )}
          </div>
          <div className='flex-1'>
            <div className='flex items-center space-x-2 mb-1'>
              <span className='font-medium text-secondary-900 capitalize'>
                {type}
              </span>
              <span
                className={`text-lg font-bold ${
                  type === 'sent' ? 'text-error-600' : 'text-success-600'
                }`}>
                {type === 'sent' ? '-' : '+'}
                {amount} SC
              </span>
            </div>
            <div className='text-sm text-secondary-600'>
              {type === 'sent' ? 'To: ' : 'From: '}
              <span className='font-mono'>
                {type === 'sent'
                  ? formatHash(recipient)
                  : formatHash(transaction.input.address)}
              </span>
            </div>
            <div className='flex items-center text-xs text-secondary-500 mt-1'>
              <Clock className='w-3 h-3 mr-1' />
              {new Date(transaction.input.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={() => setSelectedTransaction(transaction)}
            className='btn-outline text-xs'>
            <Eye className='w-4 h-4 mr-1' />
            Details
          </button>
        </div>
      </div>
    );
  };

  if (loading && transactions.length === 0) {
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
            Transactions
          </h1>
          <p className='text-secondary-600'>
            View and analyze your transaction history
          </p>
        </div>
        <button
          onClick={exportTransactions}
          className='btn-outline'
          disabled={filteredTransactions.length === 0}>
          <Download className='w-4 h-4 mr-2' />
          Export CSV
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='card'>
          <div className='flex items-center space-x-3'>
            <div className='p-3 bg-success-100 text-success-600 rounded-lg'>
              <TrendingUp className='w-6 h-6' />
            </div>
            <div>
              <p className='text-sm text-secondary-600'>Total Received</p>
              <p className='text-xl font-bold text-success-600'>
                {filteredTransactions
                  .filter(
                    (tx) =>
                      getTransactionType(tx, walletData?.address) === 'received'
                  )
                  .reduce(
                    (sum, tx) =>
                      sum + getTransactionAmount(tx, walletData?.address),
                    0
                  )
                  .toFixed(2)}{' '}
                SC
              </p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center space-x-3'>
            <div className='p-3 bg-error-100 text-error-600 rounded-lg'>
              <TrendingDown className='w-6 h-6' />
            </div>
            <div>
              <p className='text-sm text-secondary-600'>Total Sent</p>
              <p className='text-xl font-bold text-error-600'>
                {filteredTransactions
                  .filter(
                    (tx) =>
                      getTransactionType(tx, walletData?.address) === 'sent'
                  )
                  .reduce(
                    (sum, tx) =>
                      sum + getTransactionAmount(tx, walletData?.address),
                    0
                  )
                  .toFixed(2)}{' '}
                SC
              </p>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='flex items-center space-x-3'>
            <div className='p-3 bg-primary-100 text-primary-600 rounded-lg'>
              <Hash className='w-6 h-6' />
            </div>
            <div>
              <p className='text-sm text-secondary-600'>Total Transactions</p>
              <p className='text-xl font-bold text-primary-600'>
                {filteredTransactions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-semibold text-secondary-900'>
            Filter & Search
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-2'>
              Search
            </label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='input pl-10'
                placeholder='Search by ID or address'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-2'>
              Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className='input'>
              <option value='all'>All Transactions</option>
              <option value='sent'>Sent Only</option>
              <option value='received'>Received Only</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-2'>
              From Date
            </label>
            <input
              type='date'
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
              className='input'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-secondary-700 mb-2'>
              To Date
            </label>
            <input
              type='date'
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
              className='input'
            />
          </div>
        </div>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-semibold text-secondary-900'>
            Transaction History
          </h3>
          <span className='text-sm text-secondary-600'>
            Showing {filteredTransactions.length} of {pagination.total}{' '}
            transactions
          </span>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className='space-y-3'>
            {filteredTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <Hash className='w-16 h-16 text-secondary-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-secondary-900 mb-1'>
              No transactions found
            </h3>
            <p className='text-secondary-600'>
              {searchQuery || filter !== 'all' || dateRange.from || dateRange.to
                ? 'Try adjusting your filters'
                : 'No transactions have been made yet'}
            </p>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className='flex items-center justify-between pt-4 border-t'>
            <div className='text-sm text-secondary-600'>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className='btn-outline'>
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className='btn-outline'>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTransaction && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-secondary-900'>
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className='text-secondary-400 hover:text-secondary-600'>
                ×
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-secondary-600'>
                  Transaction ID
                </label>
                <div className='font-mono text-sm text-secondary-900 bg-secondary-50 p-2 rounded mt-1 break-all'>
                  {selectedTransaction.id}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-secondary-600'>
                    From Address
                  </label>
                  <div className='font-mono text-sm text-secondary-900 bg-secondary-50 p-2 rounded mt-1 break-all'>
                    {selectedTransaction.input.address}
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-secondary-600'>
                    Amount
                  </label>
                  <div className='text-sm text-secondary-900 bg-secondary-50 p-2 rounded mt-1'>
                    {selectedTransaction.input.amount} SC
                  </div>
                </div>
              </div>

              <div>
                <label className='text-sm font-medium text-secondary-600'>
                  Timestamp
                </label>
                <div className='text-sm text-secondary-900 bg-secondary-50 p-2 rounded mt-1'>
                  {new Date(
                    selectedTransaction.input.timestamp
                  ).toLocaleString()}
                </div>
              </div>

              <div>
                <label className='text-sm font-medium text-secondary-600 mb-2 block'>
                  Output Map
                </label>
                <div className='space-y-2'>
                  {Object.entries(selectedTransaction.outputMap).map(
                    ([address, amount]) => (
                      <div
                        key={address}
                        className='flex justify-between items-center bg-secondary-50 p-2 rounded'>
                        <span className='font-mono text-sm'>
                          {formatHash(address)}
                        </span>
                        <span className='font-medium'>{amount} SC</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className='text-sm font-medium text-secondary-600'>
                  Signature
                </label>
                <div className='font-mono text-xs text-secondary-900 bg-secondary-50 p-2 rounded mt-1 break-all'>
                  {selectedTransaction.input.signature}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
