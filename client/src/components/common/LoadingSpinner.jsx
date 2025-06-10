import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <div className={`loading-spinner ${sizes[size]} mb-4`}></div>
      <p className='text-secondary-600 text-sm'>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
