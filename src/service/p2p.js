import WebSocket from 'ws';
import Nodo from '../blockchain'
import Peer from '../blockchain'
import Wallet from '../wallet';


const { P2P_PORT = 5000, PEERS } = process.env;

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
    //blockchain.nodos.push(`ws:localhost:${ P2P_PORT }`);
    console.log('[ws:socket] connected.');
    this.sockets.push(socket);
    socket.on('message', (message) => {
      const { type, value } = JSON.parse(message);

      try {
        if (type === MESSAGE.BLOCKS) blockchain.replace(value);
        else if (type === MESSAGE.TX) blockchain.memoryPool.addOrUpdate(value);
        else if (type === MESSAGE.WIPE) blockchain.memoryPool.wipe();
        else if (type === MESSAGE.PEER) { this.replacePeers(value); }
        else if (type === MESSAGE.SETPEERS) { this.replaceSetPeers(value); } //puesto por mi para pruebas
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
    for (let i = 0; i < this.setPeers.length ; i++) {
      laux.push(this.setPeers[i][0]);

      if( (this.setPeers[i][0] == newSetPeers[0][0]) && (this.setPeers[i][1] != newSetPeers[0][1])){ 
        this.setPeers[i][1] = newSetPeers[0][1];
      }
    }

    if(laux.includes(newSetPeers[0][0]) == false){

      this.setPeers.push(newSetPeers[0]);
        
    }

  }
  

}

export { MESSAGE };

export default P2PService;