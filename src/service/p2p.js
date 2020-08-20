import WebSocket from 'ws';
import Nodo from '../blockchain'
import Wallet from '../wallet';


const { P2P_PORT = 5000, PEERS } = process.env;
const peers = PEERS ? PEERS.split(',') : [];
const MESSAGE = {
  BLOCKS: 'blocks',
  TX: 'transaction',
  WIPE: 'wipe_memorypool',
  NODOS: 'nodos'
,};


class P2PService {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.sockets = [`ws:localhost:${ P2P_PORT }`];
    //this.sockets = [];
  }

/* ORIGINAL

  listen() {

    const server = new WebSocket.Server({ port: P2P_PORT });
    server.on('connection', (socket) => this.onConnection(socket));

    peers.forEach((peer) => {
      const socket = new WebSocket(peer);
      socket.on('open', () => this.onConnection(socket));
    });

    console.log(`Service ws:${P2P_PORT} listening...`);
  }
*/
    listen() {

    const server = new WebSocket.Server({ port: P2P_PORT });
    server.on('connection', (socket) => this.onConnection(socket));

    peers.forEach((peer) => {
      const socket = new WebSocket(peer);
      socket.on('open', () => this.onConnection(socket));
    });

    console.log(`Service ws:${P2P_PORT} listening...`);
  }

/* ORIGINAL

onConnection(socket) {
    const { blockchain } = this;

    console.log('[ws:socket] connected.');
    this.sockets.push(socket);
    socket.on('message', (message) => {
      const { type, value } = JSON.parse(message);

      try {
        if (type === MESSAGE.BLOCKS) blockchain.replace(value);
        else if (type === MESSAGE.TX) blockchain.memoryPool.addOrUpdate(value);
        else if (type === MESSAGE.WIPE) blockchain.memoryPool.wipe();
      } catch (error) {
        console.log(`[ws:message] error ${error}`);
        throw Error(error);
      }
    });
*/


  onConnection(socket) {
    const { blockchain } = this;
    //blockchain.nodos.push(`ws:localhost:${ P2P_PORT }`);
    console.log('[ws:socket] connected.');
    //this.sockets.push(socket);
    socket.on('message', (message) => {
      const { type, value } = JSON.parse(message);

      try {
        if (type === MESSAGE.BLOCKS) blockchain.replace(value);
        else if (type === MESSAGE.TX) blockchain.memoryPool.addOrUpdate(value);
        else if (type === MESSAGE.WIPE) blockchain.memoryPool.wipe();
        else if (type === MESSAGE.NODOS) {this.replaceSockets(value); console.log('value: ',value);console.log('this.sockets: ',this.sockets);} //puesto por mi para pruebas
      } catch (error) {
        console.log(`[ws:message] error ${error}`);
        throw Error(error);
      }
    });



    socket.send(JSON.stringify({ type: MESSAGE.BLOCKS, value: blockchain.blocks }));
    socket.send(JSON.stringify({ type: MESSAGE.NODOS, value: this.sockets }));

    console.log('this.sockets: ',this.sockets);
  }

  sync() {
    const { blockchain: { blocks } } = this;
    //const { P2PService: { sockets } } = this; // añadido para sincronizar todos lo nodos
    this.broadcast(MESSAGE.BLOCKS, blocks);
    this.broadcast(MESSAGE.NODOS, this.sockets);
  }

  broadcast(type, value) {

    console.log(`[ws:broadcast] ${type}...`);
    const message = JSON.stringify({ type, value });
    this.sockets.forEach((socket) => socket.send(message));
  }

/* ORIGINAL

  replace(newBlocks = []) {
    //if (newBlocks.length < this.blocks.length) throw Error('Received chain is not longer than current chain.');
    try {
      validate(newBlocks);
    } catch (error) {
      throw Error('Received chain is invalid');
    }

    this.blocks = newBlocks;

    return this.blocks;
}*/

  replaceSockets( newSockets ){
    
    newSockets.forEach((peer) => {
    
      if (this.sockets.includes(peer) == false){
        this.sockets.push(peer);
        peers.push(peer);

        const socket = new WebSocket(peer);
        socket.on('open', () => this.onConnection(socket));
      } 
    });
    

    return this.sockets;
  }





}

export { MESSAGE };

export default P2PService;