import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Wallet from './components/wallet/Wallet';
import Mining from './components/mining/Mining';
import Explorer from './components/explorer/Explorer';
import Transactions from './components/transactions/Transactions';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to='/login' replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? children : <Navigate to='/dashboard' replace />;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className='min-h-screen bg-secondary-50'>
      <Routes>
        <Route
          path='/login'
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path='/register'
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path='/*'
          element={
            <ProtectedRoute>
              <div className='flex flex-col min-h-screen'>
                <Navbar />
                <main className='flex-1 container mx-auto px-4 py-8'>
                  <Routes>
                    <Route path='/dashboard' element={<Dashboard />} />
                    <Route path='/wallet' element={<Wallet />} />
                    <Route path='/mining' element={<Mining />} />
                    <Route path='/explorer' element={<Explorer />} />
                    <Route path='/transactions' element={<Transactions />} />
                    <Route
                      path='/'
                      element={<Navigate to='/dashboard' replace />}
                    />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
