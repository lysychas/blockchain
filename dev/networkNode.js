const express = require('express');
const app = express();

app.use(express.json());

const uuid = require('uuid').v1;
const rp = require('request-promise');

const port = process.argv[2];
const nodeAddress = uuid().split('-').join(''); // replace dashes with empty space, needs unique string to not send bitcoin to the wrong person

const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

// get entire blockchain
app.get('/', function (req, res) {
  res.send(bitcoin);
});

// get entire blockchain
app.get('/blockchain', function (req, res) {
  res.send(bitcoin);
});

// create a new transaction
app.post('/transaction', function (req, res) {
  const blockIndex = bitcoin.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

// mine a block
app.get('/mine', function (req, res) {
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];

  const currentBlockData = {
    // we can add more data if we want
    transactions: bitcoin.pendingTransactions,
    index: lastBlock['index'] + 1,
  };

  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );
  bitcoin.createNewTransaction(12.5, '00', nodeAddress); // miner reward, sender always '00' to indictate mine reward, 12.5 is always a reward for successful Real-Life bitcoin mine

  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

  res.json({ note: 'New block mined successfully!.', block: newBlock });
});

const nodeNotAlreadyPresent = (newNodeUrl) => {
  return bitcoin.networkNodes.indexOf(newNodeUrl) === -1;
};

const notCurrentNode = (newNodeUrl) => {
  return bitcoin.currentNodeUrl !== newNodeUrl;
};

// register a node and broadcast it in the network of existing nodes for them to also register (DO NOT BROADCAST ANYMORE TO AVOID INFINITE LOOP, ONLY ONCE)
app.post('/register-and-broadcast-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl; // pass in the url we want to register
  if (nodeNotAlreadyPresent()) bitcoin.networkNodes.push(newNodeUrl); // check if this node already exists in the network

  const regNodesPromises = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    // for every network node inside netwrok nodes array, register new node
    const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: { newNodeUrl: newNodeUrl },
      json: true,
    };
    regNodesPromises.push(rp(requestOptions)); // make a async request to each node
  });

  Promise.all(regNodesPromises)
    .then((data) => {
      const bulkRegisterOptions = {
        uri: newNodeUrl + '/register-nodes-bulk',
        method: 'POST',
        body: {
          allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl], // spread operator, cuz we don't want an array inside an array
        },
        json: true,
      };
      return rp(bulkRegisterOptions);
    })
    .then((data) => {
      res.json({ note: 'New node registered with network successfully.' });
    });
});

// register a node with the network
app.post('/register-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (nodeNotAlreadyPresent() && notCurrentNode())
    bitcoin.networkNodes.push(newNodeUrl);

  res.json({ note: 'New node registered successfully.' });
});

// register multiple nodes at once
app.post('/register-nodes-bulk', function (req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    if (nodeNotAlreadyPresent() && notCurrentNode())
      bitcoin.networkNodes.push(networkNodeUrl);
  });

  res.json({ note: 'Bulk registration successful.' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}...`);
});
