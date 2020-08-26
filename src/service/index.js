import express from 'express';
import bodyParser from 'body-parser';

import Blockchain from '../blockchain';
import Wallet from '../wallet';
import P2PService, { MESSAGE } from './p2p';
import Miner from '../miner';

import Nodo from '../blockchain/nodo.js';



const { HTTP_PORT = 3000 } = process.env;
const { P2P_PORT = 5000, PEERS } = process.env;

const app = express();
const blockchain = new Blockchain();
const wallet = new Wallet(blockchain);
const walletMiner = new Wallet(blockchain, 0);
const nodo = new Nodo( wallet );
const p2pService = new P2PService(blockchain, nodo);
const miner = new Miner(blockchain, p2pService, walletMiner);




/////////////////////////////////////////////////////////////
////  para poder inicializar el nodo principal
/////////////////////////////////////////////////////////////

if(p2pService.peers[0] == `ws:localhost:5000`){
  p2pService.peers.push(`ws:localhost:${ P2P_PORT }`);
}

/////////////////////////////////////////////////////////////

app.use(bodyParser.json());

app.get('/blocks', (req, res) => {
  p2pService.myNodo[2] = wallet.balance;
  p2pService.setPeers[0] = p2pService.myNodo;
  p2pService.sync();

  res.json(blockchain.blocks);
});

app.get('/nodos', (req, res) => {
  p2pService.myNodo[2] = wallet.balance;
  p2pService.setPeers[0] = p2pService.myNodo;
  p2pService.sync();

  res.json(p2pService.peers);
});

app.get('/peers', (req, res) => {
  
  p2pService.myNodo[2] = wallet.balance;
  p2pService.setPeers[0] = p2pService.myNodo;
  p2pService.sync();
  


  res.json(p2pService.setPeers);
});

app.get('/wallet', (req, res) => {
  p2pService.myNodo[2] = wallet.balance;
  p2pService.setPeers[0] = p2pService.myNodo;
  p2pService.sync();

  res.json(wallet.toString());
});

/*
app.get('/nodo', (req, res) => {
  res.json( p2pService.myNodo );
});
*/

app.post('/nodo', (req, res) => {
  const { body: { publicKey } } = req;
  
  p2pService.sync();

  try {
    let nodo = p2pService.searchNodo( publicKey );
    res.json(nodo);
  } catch (error) {
    res.json({ error: error.message });
  }

});

//de momento inactivo por que utilizamos transacciones para minar
/*
app.post('/mine', (req, res) => {
  const { body: { data } } = req;
  const block = blockchain.addBlock(data);

  p2pService.sync();

  res.json({
    blocks: blockchain.blocks.length,
    block,
  });
});
*/

app.get('/transactions', (req, res) => {
  const { memoryPool: { transactions } } = blockchain;
  res.json(transactions);
});

app.post('/transaction', (req, res) => {

  p2pService.myNodo[2] = wallet.balance;
  p2pService.setPeers[0] = p2pService.myNodo;
  p2pService.sync();

  const { body: { recipient, amount } } = req;

  try {
    const tx = wallet.createTransaction(recipient, amount);
    p2pService.broadcast(MESSAGE.TX, tx);
    res.json(tx);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/mine/transactions', (req, res) => {

  p2pService.myNodo[2] = wallet.balance;
  p2pService.setPeers[0] = p2pService.myNodo;
  p2pService.sync();

  try {
    miner.mine();
    res.redirect('/blocks');
  } catch (error) {
    res.json({ error: error.message });

  }
});

app.listen(HTTP_PORT, () => {
  console.log(`Service HTTP:${HTTP_PORT} listening...`);
  p2pService.listen();
});