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
  getPKHByPath,
  getGlobalMetaid,
  createPin
} from './actions'

import { btcKeys, dogeKeys, createAction, ActionType, on, removeListener } from './actions'

// Import package.json to get version
import packageInfo from '../../package.json'

// Import utils for crypto functions
import utils from './utils'

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

  doge: {
    getBalance: any
    getAddress: any
    getPublicKey: any
    getUtxos: any
    inscribe: any
  }

  // utils for crypto functions (no wallet account required)
  utils: {
    encrypt: (data: string, key: string) => string
    decrypt: (encryptedData: string, key: string) => string
    encryptAesCBC: (data: string, key: string, iv?: string) => string
    decryptAesCBC: (encryptedData: string, key: string, iv?: string) => string
    sha256: (data: string) => string
    md5: (data: string) => string
    base64Encode: (data: string) => string
    base64Decode: (data: string) => string
    hmacSha256: (data: string, key: string) => string
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
  getGlobalMetaid,
  createPin,

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

  doge: {},

  // utils for crypto functions (no wallet account required)
  utils: {},

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

Object.keys(dogeKeys).forEach((type) => {
  const actionType = type as Exclude<ActionType, 'event'>
  dogeKeys[actionType].forEach((item) => {
    metalet['doge'][item.name] = async (params?: any) => {
      return await createAction(item.action, actionType, params)
    }
  })
})

// Add utils methods (sync, no popup, no wallet account required)
metalet.utils = utils

window.metaidwallet = metalet
