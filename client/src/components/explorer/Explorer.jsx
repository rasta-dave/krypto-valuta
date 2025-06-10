import { Search } from 'lucide-react';

const Explorer = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-3'>
        <Search className='w-8 h-8 text-primary-600' />
        <h1 className='text-3xl font-bold gradient-text'>
          Blockchain Explorer
        </h1>
      </div>

      <div className='card'>
        <p className='text-secondary-600'>
          Blockchain explorer functionality coming soon...
        </p>
      </div>
    </div>
  );
};

export default Explorer;
