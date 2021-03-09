const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid').v1;

function Blockchain() {
  // constructor function
  this.chain = [];
  this.pendingTransactions = [];

  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];

  this.createNewBlock(100, '0', '0'); // genesis block
}

Blockchain.prototype.createNewBlock = function (
  nonce,
  previousBlockHash,
  hash
) {
  // create a new block object
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce: nonce, // comes from Proof of Work
    hash: hash, // data from current block hashed into a string
    previousBlockHash: previousBlockHash, // data from previous block
  };
  this.pendingTransactions = []; // after creating new block with pending transactions, remove all pending transactions
  this.chain.push(newBlock); // push new block to chain

  return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function (
  amount,
  sender,
  recipient
) {
  // create a new transaction object
  const newTransaction = {
    amount: amount,
    sender: sender,
    recipient: recipient,
    transactionId: uuid().split('-').join(''), // replace dashes with empty space
  };
  this.pendingTransactions.push(newTransaction); // our new transaction will be in the next created (mined) block

  return newTransaction;
};

Blockchain.prototype.hashBlock = function ( // creates a hash of block datas
  previousBlockHash,
  nonce,
  currentBlockData
) {
  const dataAsString =
    previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
  const hash = sha256(dataAsString);

  return hash;
};

Blockchain.prototype.proofOfWork = function(){
  // => repeatedly hash block until it finds correct hash => '0000...'
  // => uses current block data for the hash, but also the previousBlockHash
  // => continously changes nonce value until it finds the correct hash
  // => returns to us the nonce value that creates the correct hash
}

module.exports = Blockchain;
