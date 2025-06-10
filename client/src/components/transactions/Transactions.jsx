import { CreditCard } from 'lucide-react';

const Transactions = () => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-3'>
        <CreditCard className='w-8 h-8 text-primary-600' />
        <h1 className='text-3xl font-bold gradient-text'>Transactions</h1>
      </div>

      <div className='card'>
        <p className='text-secondary-600'>
          Transaction management coming soon...
        </p>
      </div>
    </div>
  );
};

export default Transactions;
