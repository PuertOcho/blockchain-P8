import Wallet from '../wallet';


const { P2P_PORT = 5000 } = process.env;


class Nodo {
	constructor( wallet ) {

  this.socket = `ws:localhost:${ P2P_PORT }`;
	this.publicKey = wallet.publicKey;
}



  toString() {
    const {
      publicKey, socket,
    } = this;

    return `${socket}  : ${publicKey.toString()}
    `;
  }

}

export default Nodo;