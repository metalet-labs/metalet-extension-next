import {
  ping,
  connect,
  isConnected,
  disconnect,
  getAddress,
  getPublicKey,
  getXPublicKey,
  getBalance,
  getUtxos,
  getTokenBalance,
  transfer,
  merge,
  getNetwork,
  switchNetwork,
  eciesEncrypt,
  eciesDecrypt,
  signMessage,
  verifySignature,
  previewTransaction,
  signTransaction,
  signTransactions,
  unlockP2PKHInput,
  pay,
  signPartialTx,
  ecdh,
  transferNFT,
  omniConnect,
  autoPayment,
  autoPaymentStatus,
  smallPay,
  storageChunk,
  getPKHByPath
} from './actions'

import { btcKeys, createAction, ActionType, on, removeListener } from './actions'

// Import package.json to get version
import packageInfo from '../../package.json'

type Metalet = {
  ping: any
  connect: any
  disconnect: any
  isConnected: any
  getNetwork: any
  switchNetwork: any
  getAddress: any
  getPublicKey: any
  getXPublicKey: any
  getBalance: any
  merge: any
  previewTransaction: any
  signTransaction: any
  signTransactions: any
  unlockP2PKHInput: any
  pay: any
  signMessage: any
  verifySignature: any
  getUtxos: any
  //   getActivities: any
  transfer: any
  // transferAll: any
  //   merge: any
  //   getActivities: any

  eciesEncrypt: any
  eciesDecrypt: any

  token: {
    //   list: any
    getBalance: any
    //   transfer: any
    //   merge: any
    //   getActivities: any
  }
  nft: {
    //   list: any
    //   transfer: any
    //   getActivities: any
  }

  btc: {
    getBalance: any
    getAddress: any
    getPublicKey: any
    getUtxos: any
  }

  // Deprecating
  requestAccount: any
  getAccount: any
  exitAccount: any
  getMvcBalance: any
  getSensibleFtBalance: any
}

const metalet: any = {
  version: packageInfo.version,
  ping,
  connect,
  isConnected,
  disconnect,
  getNetwork,
  switchNetwork,
  getAddress,
  getPublicKey,
  getXPublicKey,
  getBalance,
  getUtxos,
  transfer,
  merge,
  previewTransaction,
  signTransaction,
  signTransactions,
  unlockP2PKHInput,
  pay,
  signPartialTx,
  signMessage,
  verifySignature,
  // auto payment
  autoPayment,
  autoPaymentStatus,
  smallPay,
  storageChunk,
  getPKHByPath,

  eciesEncrypt,
  eciesDecrypt,
  // signTransaction,
  // transferAll,
  token: {
    getBalance: getTokenBalance,
  },
  common: {
    ecdh,
    omniConnect,
  },
  nft: {},

  btc: {},

  // event
  on,
  removeListener,

  // Deprecating
  requestAccount: connect,
  getAccount: connect,
  exitAccount: disconnect,
  getMvcBalance: getBalance,
  getSensibleFtBalance: getTokenBalance,
  transferNFT,
}

Object.keys(btcKeys).forEach((type) => {
  const actionType = type as Exclude<ActionType, 'event'>
  btcKeys[actionType].forEach((item) => {
    metalet['btc'][item.name] = async (params?: any) => {
      return await createAction(item.action, actionType, params)
    }
  })
})

window.metaidwallet = metalet
