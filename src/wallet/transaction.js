import {v1 as uuidv1} from 'uuid';
import { elliptic } from '../modules';

class Transaction {
  constructor() {
    this.id = uuidv1();
    this.input = null;
    this.outputs = [];
  }

  static create(senderWallet, recipientAdress, amount) {
    const { balance, publicKey } = senderWallet;

    if (amount > balance) throw Error(`Amount: ${amount} exceeds balance.`);

    const transaction = new Transaction();
    transaction.outputs.push(...[
      { amount: balance - amount, address: publicKey },
      { amount, address: recipientAdress },
    ]);

    transaction.input = {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(transaction.outputs),
    };

    return transaction;
  }

  static verify(transaction) {
    const { input: { address, signature }, outputs } = transaction;

    return elliptic.verifySignature(address, signature, outputs);
  }
}

export default Transaction;