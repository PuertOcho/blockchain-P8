//import Wallet from '../wallet';


const { P2P_PORT = 5000 } = process.env;


class Peer {
  constructor( peer , PK = null) {

  this.peerName = peer;
  this.peerPublicKey = PK;

  
}





  toString() {
    const {
      peerPublicKey, peerName,
    } = this;

    return `${peerName}  : ${peerPublicKey.toString()}
    `;
  }

}

export default Peer;