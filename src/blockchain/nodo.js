import Wallet from '../wallet';


const { P2P_PORT = 5000 } = process.env;


class Nodo {
	constructor( wallet ) {

	this.publicKey2 = wallet.publicKey;
  this.socket = `ws:localhost:${ P2P_PORT }`;
  
}



  toString() {
    const {
      publicKey2, socket,
    } = this;

    return `${socket}  : ${publicKey2.toString()}
    `;
  }

}

export default Nodo;