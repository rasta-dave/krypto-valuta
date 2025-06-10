import React, { useState, useEffect } from 'react';
import { walletAPI } from '../../utils/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import {
  Wallet as WalletIcon,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Wallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
  });
  const { broadcastTransaction } = useWebSocket();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletResponse, transactionsResponse] = await Promise.all([
        walletAPI.getInfo(),
        walletAPI.getTransactions({ page: 1, limit: 10 }),
      ]);

      setWalletData(walletResponse.data.data);
      setTransactions(transactionsResponse.data.data.transactions);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendTransaction = async (e) => {
    e.preventDefault();

    if (!formData.recipient || !formData.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (parseFloat(formData.amount) > walletData.balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setSendLoading(true);
      const response = await walletAPI.createTransaction({
        recipient: formData.recipient,
        amount: parseFloat(formData.amount),
      });

      if (response.data.success) {
        toast.success('Transaction sent successfully!');
        broadcastTransaction(response.data.data.transaction);
        setFormData({ recipient: '', amount: '' });
        fetchWalletData();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Transaction failed';
      toast.error(message);
    } finally {
      setSendLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletData.address);
    toast.success('Address copied to clipboard');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(
      address.length - 8
    )}`;
  };

  const getTransactionType = (transaction, userAddress) => {
    if (transaction.input.address === userAddress) {
      return 'sent';
    }
    return 'received';
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
          <h1 className='text-3xl font-bold text-secondary-900'>Wallet</h1>
          <p className='text-secondary-600'>
            Manage your SmartChain coins and transactions
          </p>
        </div>
        <button
          onClick={fetchWalletData}
          className='btn-outline'
          disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Wallet Overview
            </h3>
          </div>

          <div className='space-y-6'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                <WalletIcon className='w-8 h-8 text-white' />
              </div>
              <div className='text-3xl font-bold gradient-text mb-2'>
                {walletData?.balance || 0} SC
              </div>
              <p className='text-secondary-600'>Available Balance</p>
            </div>

            <div className='bg-secondary-50 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-secondary-700'>
                  Your Address
                </span>
                <button
                  onClick={copyAddress}
                  className='text-primary-600 hover:text-primary-700 text-sm'>
                  <Copy className='w-4 h-4' />
                </button>
              </div>
              <div className='font-mono text-sm text-secondary-600 break-all'>
                {walletData?.address}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center'>
                <div className='text-xl font-bold text-secondary-900'>
                  {
                    transactions.filter(
                      (tx) =>
                        getTransactionType(tx, walletData.address) ===
                        'received'
                    ).length
                  }
                </div>
                <div className='text-sm text-secondary-600'>Received</div>
              </div>
              <div className='text-center'>
                <div className='text-xl font-bold text-secondary-900'>
                  {
                    transactions.filter(
                      (tx) =>
                        getTransactionType(tx, walletData.address) === 'sent'
                    ).length
                  }
                </div>
                <div className='text-sm text-secondary-600'>Sent</div>
              </div>
            </div>
          </div>
        </div>

        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Send Transaction
            </h3>
          </div>

          <form onSubmit={handleSendTransaction} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-2'>
                Recipient Address
              </label>
              <input
                type='text'
                name='recipient'
                value={formData.recipient}
                onChange={handleInputChange}
                className='input'
                placeholder='Enter recipient address'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-2'>
                Amount (SC)
              </label>
              <input
                type='number'
                name='amount'
                value={formData.amount}
                onChange={handleInputChange}
                className='input'
                placeholder='0.00'
                min='0'
                step='0.01'
                required
              />
              <div className='text-xs text-secondary-500 mt-1'>
                Available: {walletData?.balance || 0} SC
              </div>
            </div>

            <button
              type='submit'
              disabled={sendLoading}
              className='btn-primary w-full'>
              {sendLoading ? (
                <div className='flex items-center justify-center'>
                  <div className='loading-spinner w-4 h-4 mr-2'></div>
                  Sending...
                </div>
              ) : (
                <div className='flex items-center justify-center'>
                  <Send className='w-4 h-4 mr-2' />
                  Send Transaction
                </div>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-semibold text-secondary-900'>
            Recent Transactions
          </h3>
        </div>

        {transactions.length > 0 ? (
          <div className='space-y-3'>
            {transactions.map((transaction, index) => {
              const type = getTransactionType(transaction, walletData.address);
              const amount =
                type === 'sent'
                  ? Object.values(transaction.outputMap).reduce(
                      (sum, val) => sum + val,
                      0
                    ) - transaction.outputMap[walletData.address] || 0
                  : transaction.outputMap[walletData.address] || 0;

              return (
                <div
                  key={index}
                  className='flex items-center justify-between p-4 bg-secondary-50 rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`p-2 rounded-full ${
                        type === 'sent'
                          ? 'bg-error-100 text-error-600'
                          : 'bg-success-100 text-success-600'
                      }`}>
                      {type === 'sent' ? (
                        <ArrowUpRight className='w-4 h-4' />
                      ) : (
                        <ArrowDownLeft className='w-4 h-4' />
                      )}
                    </div>
                    <div>
                      <div className='font-medium text-secondary-900'>
                        {type === 'sent' ? 'Sent' : 'Received'}
                      </div>
                      <div className='text-sm text-secondary-600'>
                        {type === 'sent'
                          ? `To: ${formatAddress(
                              Object.keys(transaction.outputMap).find(
                                (addr) => addr !== walletData.address
                              )
                            )}`
                          : `From: ${formatAddress(transaction.input.address)}`}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-medium ${
                      type === 'sent' ? 'text-error-600' : 'text-success-600'
                    }`}>
                    {type === 'sent' ? '-' : '+'}
                    {amount} SC
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-8'>
            <WalletIcon className='w-12 h-12 text-secondary-300 mx-auto mb-4' />
            <p className='text-secondary-500'>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
