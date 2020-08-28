import WebSocket from 'ws';
import Nodo from '../blockchain'
import Peer from '../blockchain'
import Wallet from '../wallet';
import { wallet } from './index';


const { P2P_PORT = 5000, PEERS } = process.env;

const dataWallet = [];

const MESSAGE = {
  BLOCKS: 'blocks',
  TX: 'transaction',
  WIPE: 'wipe_memorypool',
  PEER: 'peers',
  SETPEERS: 'set_peers'
,};


class P2PService {
  constructor(blockchain, nodo) {

    this.blockchain = blockchain;
    this.sockets = [];
    this.setPeers = [ Object.values(nodo) ];
    this.peers = PEERS ? PEERS.split(',') : [];
    this.myNodo = Object.values(nodo);
  }


  listen() {

    const server = new WebSocket.Server({ port: P2P_PORT });
    server.on('connection', (socket) => this.onConnection(socket));

    this.peers.forEach((peer) => {
      const socket = new WebSocket(peer);
      socket.on('open', () => this.onConnection(socket));
    });

    console.log(`Service ws:${P2P_PORT} listening...`);
  }


  onConnection(socket) {
    const { blockchain } = this;
    console.log('[ws:socket] connected.');
    this.sockets.push(socket);
    socket.on('message', (message) => {
    const { type, value } = JSON.parse(message);

      try {
        if (type === MESSAGE.BLOCKS) blockchain.replace(value);
        else if (type === MESSAGE.TX) {
            blockchain.memoryPool.addOrUpdate(value);
            wallet.update( value.input.address, value.outputs[1].address, Number(value.outputs[1].amount) );
            this.sync();  
        }
        else if (type === MESSAGE.WIPE) blockchain.memoryPool.wipe();
        else if (type === MESSAGE.PEER) { this.replacePeers(value); }
        else if (type === MESSAGE.SETPEERS) { this.replaceSetPeers(value); }
      } catch (error) {
        console.log(`[ws:message] error ${error}`);
        throw Error(error);
      }
    });



    socket.send(JSON.stringify({ type: MESSAGE.BLOCKS, value: blockchain.blocks }));
    socket.send(JSON.stringify({ type: MESSAGE.PEER, value: this.peers }));
    socket.send(JSON.stringify({ type: MESSAGE.SETPEERS, value: this.setPeers }));
    
  }

  sync() {
    const { blockchain: { blocks } } = this;
    this.myNodo[2] = wallet.balance;// 
    this.setPeers[0] = this.myNodo;// machacamos el valor que teniamos antes que siempre sera deprecated

    this.broadcast(MESSAGE.BLOCKS, blocks);
    this.broadcast(MESSAGE.PEER, this.peers);
    this.broadcast(MESSAGE.SETPEERS, this.setPeers);
  }

  broadcast(type, value) {

    console.log(`[ws:broadcast] ${type}...`);
    const message = JSON.stringify({ type, value });
    this.sockets.forEach((socket) => socket.send(message));
  }


  replacePeers( newPeers ){
    
    newPeers.forEach((peer) => {
    
      if (this.peers.includes(peer) == false){
        this.peers.push(peer);

        const socket = new WebSocket(peer);
        socket.on('open', () => this.onConnection(socket));
      } 
    });

  }

  replaceSetPeers( newSetPeers ){
    const laux = [];
    //actualizamos las claves publicas que hallan cambiado, asociadas a un Peer y añadimos una lista que nos indicara si este elemento se encuentra en la lista o no.
    this.setPeers.forEach((peer) => {
      laux.push(peer.[0]);
      if( (peer.[0] == newSetPeers[0][0]) && (peer.[1] != newSetPeers[0][1])){ peer.[1] = newSetPeers[0][1]; }
      if( (peer.[0] == newSetPeers[0][0]) && (peer.[2] != newSetPeers[0][2])){ peer.[2] = newSetPeers[0][2]; }
    });

    if(laux.includes(newSetPeers[0][0]) == false){
      this.setPeers.push(newSetPeers[0]);
    }
  }

  searchNodo( targetPublickey ) {

    let socket;
    let publicKey;
    let balance;
    let idTransactions = [];
  
    this.setPeers.forEach((peer) => {
      
      if( peer[1] == targetPublickey ){
        socket = peer[0];   publicKey = peer[1];    balance = peer[2];
      } 
        
    });

    this.blockchain.blocks.forEach((block) => {
      
      for (let j = 0; j < block.data.length; j++) {
        if (block.data != 'GENESIS-DATA'){
          let { id, input, outputs } = block.data[j];
          if( input.address == publicKey || outputs[0].address == publicKey){
            idTransactions.push(id);
          }
        }
      }
    });

    return { socket, publicKey, balance, idTransactions};
  }


}

export { MESSAGE };

export default P2PService;