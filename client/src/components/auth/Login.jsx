import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <div className='mx-auto h-12 w-12 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center'>
            <span className='text-white font-bold text-lg'>SC</span>
          </div>
          <h2 className='mt-6 text-center text-3xl font-bold gradient-text'>
            Sign in to SmartChain
          </h2>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-4'>
            <div>
              <label htmlFor='email' className='sr-only'>
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                className='input'
                placeholder='Email address'
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className='relative'>
              <label htmlFor='password' className='sr-only'>
                Password
              </label>
              <input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                required
                className='input pr-10'
                placeholder='Password'
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff className='h-5 w-5 text-secondary-400' />
                ) : (
                  <Eye className='h-5 w-5 text-secondary-400' />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={loading}
              className='btn-primary w-full'>
              {loading ? (
                <div className='loading-spinner w-5 h-5 mr-2' />
              ) : (
                <LogIn className='w-5 h-5 mr-2' />
              )}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className='text-center'>
            <span className='text-secondary-600'>Don't have an account? </span>
            <Link
              to='/register'
              className='text-primary-600 hover:text-primary-500 font-medium'>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
