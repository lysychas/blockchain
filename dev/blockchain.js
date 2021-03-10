const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid').v1;

function Blockchain() {
  // constructor function
  this.chain = [];
  this.pendingTransactions = [];

  this.currentNodeUrl = currentNodeUrl; // know your own node Url
  this.networkNodes = []; // be aware of all of the other nodes in the network

  this.createNewBlock(100, '0', '0'); // genesis block - first block in a block chain
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

  return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransactions = function (
  transactionObj // newTransaction goes here
) {
  // our new transaction will be in the next created (mined) block
  this.pendingTransactions.push(transactionObj);

  return this.getLastBlock()['index'] + 1;
};

Blockchain.prototype.hashBlock = function (
  // creates a hash of block datas
  previousBlockHash,
  currentBlockData,
  nonce
) {
  const dataAsString =
    previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
  const hash = sha256(dataAsString);

  return hash;
};

Blockchain.prototype.proofOfWork = function (
  // everytime we mine new a block in the chain, we check if that block is legitimate
  previousBlockHash,
  currentBlockData
) {
  // => repeatedly hash block until it finds correct hash => '0000...'
  // => uses current block data for the hash, but also the previousBlockHash
  // => continously changes nonce value until it finds the correct hash
  // => returns to us the nonce value that creates the correct hash
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== '0000') {
    nonce += 1;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  }

  return nonce;
};

// consensus - block validation, to make sure each node is properly in sync and no one is cheating
Blockchain.prototype.chainIsValid = function (blockchain) {
  let validChain = true;

  for (var i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i - 1];

    // if currentBlock's previousBlockHash is different from the previousBlock's hash, set flag to false
    if (currentBlock['previousBlockHash'] !== prevBlock['hash'])
      validChain = false;

    const blockHash = this.hashBlock(
      prevBlock['hash'],
      {
        transactions: currentBlock['transactions'],
        index: currentBlock['index'],
      },
      currentBlock['nonce']
    );

    // proofOfWork check, valid block hashes must start with '0000...'
    if (blockHash.substring(0, 4) !== '0000') validChain = false;

    // console.log('previousBlockHash =>', prevBlock['hash']);
    // console.log('currentBlockHash =>', currentBlock['hash']);
  }

  // genesis block check
  const genesisBlock = blockchain[0];
  const correctNonce = genesisBlock['nonce'] === 100;
  const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
  const correctHash = genesisBlock['hash'] === '0';
  const correctTransactions = genesisBlock['transactions'].length === 0;

  if (
    !correctNonce ||
    !correctPreviousBlockHash ||
    !correctHash ||
    !correctTransactions
  )
    validChain = false;

  return validChain;
};

Blockchain.prototype.getBlock = function (blockHash) {
  let correctBlock = null;
  // console.log("Blockchain.getBlock: looking for hash: " + blockHash);
  // PROBLEM:
  //  return on forEach doesn't work!
  //  we should probably switch this out with a proper for loop!
  //  another solution is to break the callback loop using an exception:
  var BreakException = {};
  try {
    this.chain.forEach((block) => {
      // console.log(`checking #${block.index} with hash: ${block.hash}`);
      if (block.hash === blockHash) {
        correctBlock = block;
        // console.log("Blockchain.getBlock: found hash!");
        // return when done
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) {
      throw e;
    }
  }
  // if (correctBlock) {console.log(`Blockchain.getBlock: Returning block for hash ${correctBlock.hash}`);}else{console.log(`Blockchain.getBlock: could not find block for hash ${blockHash}`);}
  return correctBlock;
};

// look up transaction object and block in which the transaction is stored based on the transaction ID
Blockchain.prototype.getTransaction = function (transactionId) {
  if (transactionId == null) {
    return {
      transaction: null,
      block: null,
    };
  }
  // an optimized version of the linear transaction search algorithm
  // this one breaks the search once the items have been found
  // speeding up the search
  for (let b = 0; b < this.chain.length; b++) {
    // iterate over all blocks in the chain
    for (let t = 0; t < this.chain[b].transactions.length; t++) {
      //console.log("inside transactions for loop");
      if (this.chain[b].transactions[t].transactionId === transactionId) {
        return {
          transaction: this.chain[b].transactions[t],
          block: this.chain[b],
        };
      }
    }
  }
  return {
    transaction: null,
    block: null,
  };
};

Blockchain.prototype.getAddressData = function (address) {
  const addressTransactions = [];
  this.chain.forEach((block) => {
    block.transactions.forEach((transaction) => {
      if (transaction.sender === address || transaction.recipient === address) {
        addressTransactions.push(transaction);
      }
    });
  });

  let balance = 0;
  addressTransactions.forEach((transaction) => {
    if (transaction.recipient === address) balance += transaction.amount;
    else if (transaction.sender === address) balance -= transaction.amount;
  });

  return {
    addressTransactions: addressTransactions,
    addressBalance: balance,
  };
};

module.exports = Blockchain;
