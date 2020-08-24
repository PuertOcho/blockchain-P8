import Wallet from '../wallet';


const { P2P_PORT = 5000 } = process.env;


class Nodo {
	constructor( wallet ) {

  this.socket = `ws:localhost:${ P2P_PORT }`;
	this.publicKey = wallet.publicKey;
  this.balance = wallet.balance;
}

  toString() {
    const { socket, publicKey, balance } = this;

    return ` Nodo -
      socket        : ${socket}
      publicKey     : ${publicKey.toString()}
      balance       : ${balance}
    `;
  }
  
}

export default Nodo;