import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import {
  Home,
  Wallet as WalletIcon,
  Hammer,
  Search,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { connected } = useWebSocket();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/wallet', label: 'Wallet', icon: WalletIcon },
    { path: '/mining', label: 'Mining', icon: Hammer },
    { path: '/explorer', label: 'Explorer', icon: Search },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className='bg-white border-b border-secondary-200 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center'>
            <Link to='/dashboard' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>SC</span>
              </div>
              <span className='gradient-text text-xl font-bold'>
                SmartChain
              </span>
            </Link>

            <div className='hidden md:flex items-center ml-10 space-x-4'>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                    }`}>
                    <Icon className='w-4 h-4 mr-2' />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className='hidden md:flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              {connected ? (
                <Wifi className='w-4 h-4 text-success-600' />
              ) : (
                <WifiOff className='w-4 h-4 text-error-600' />
              )}
              <span className='text-xs text-secondary-600'>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-2'>
                <User className='w-4 h-4 text-secondary-600' />
                <span className='text-sm font-medium text-secondary-700'>
                  {user?.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className='inline-flex items-center px-3 py-2 text-sm font-medium text-secondary-600 hover:text-error-600 transition-colors'>
                <LogOut className='w-4 h-4 mr-1' />
                Logout
              </button>
            </div>
          </div>

          <div className='md:hidden flex items-center'>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='p-2 rounded-lg text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'>
              {isMobileMenuOpen ? (
                <X className='w-6 h-6' />
              ) : (
                <Menu className='w-6 h-6' />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className='md:hidden border-t border-secondary-200 bg-white'>
          <div className='px-2 pt-2 pb-3 space-y-1'>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                  }`}>
                  <div className='flex items-center'>
                    <Icon className='w-5 h-5 mr-3' />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className='pt-4 pb-3 border-t border-secondary-200'>
            <div className='flex items-center px-5 mb-3'>
              <div className='flex items-center space-x-2'>
                {connected ? (
                  <Wifi className='w-4 h-4 text-success-600' />
                ) : (
                  <WifiOff className='w-4 h-4 text-error-600' />
                )}
                <span className='text-sm text-secondary-600'>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className='px-2 space-y-1'>
              <div className='px-3 py-2 text-base font-medium text-secondary-700'>
                {user?.username}
              </div>
              <button
                onClick={handleLogout}
                className='flex items-center w-full px-3 py-2 text-base font-medium text-error-600 hover:bg-error-50 rounded-lg'>
                <LogOut className='w-5 h-5 mr-3' />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
