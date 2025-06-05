import pkg from 'elliptic';
const { ec: EC } = pkg;

const ec = new EC('secp256k1');

export const keyMgr = {
  genKeyPair() {
    return ec.genKeyPair();
  },
};

export const verifySignature = ({ publicKey, data, signature }) => {
  const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');
  return keyFromPublic.verify(JSON.stringify(data), signature);
};
