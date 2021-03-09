const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

// testing block creation and transaction assignment
bitcoin.createNewBlock(1, '1', '1');

bitcoin.createNewTransaction(20, 'John#hashed', 'Jill#hashed');

bitcoin.createNewBlock(2, '2', '2');

const previousBlockHash = 'prev1';
const nonce = 100;
const currentBlockData = [
  {
    amount: 10,
    sender: 'James#hashed',
    recipient: 'Jacob#hashed',
  },
  {
    amount: 200,
    sender: 'James#hashed',
    recipient: 'Jacob#hashed',
  },
  {
    amount: 3000,
    sender: 'James#hashed',
    recipient: 'Jacob#hashed',
  },
];

console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce));

console.log(bitcoin.proofOfWork(previousBlockHash, currentBlockData));

console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, 21108));

console.log(bitcoin);
