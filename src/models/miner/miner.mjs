import Transaction from '../wallet/transaction.mjs';

export default class Miner {
  constructor({ transactionPool, wallet, blockchain, networkServer }) {
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.blockchain = blockchain;
    this.networkServer = networkServer;
  }

  mineTransactions() {
    let validTransactions = [];

    validTransactions = this.transactionPool.validTransactions();

    validTransactions.push(
      Transaction.transactionReward({ miner: this.wallet })
    );

    this.blockchain.addBlock({ data: validTransactions });

    this.networkServer.broadcastChain();

    this.transactionPool.clearTransactions();
  }
}
