import { createHash as hash } from 'crypto';

export const createHash = (...inputs) => {
  const hashAlgorithm = hash('sha256');
  hashAlgorithm.update(
    inputs
      .map((input) => JSON.stringify(input))
      .sort()
      .join(' ')
  );
  return hashAlgorithm.digest('hex');
};
