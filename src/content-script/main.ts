import {
  connect,
  isConnected,
  disconnect,
  getAddress,
  getPublicKey,
  getXPublicKey,
  getBalance,
  getTokenBalance,
  transfer,
  merge,
  getNetwork,
  switchNetwork,
  eciesEncrypt,
  eciesDecrypt,
  signTransaction,
} from './actions'

import { btcKeys, createAction, ActionType } from './actions'

type Metalet = {
  //   signMessage: any
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
  signTransaction: any
  //   getUtxos: any
  //   getActivities: any
  transfer: any
  // transferAll: any
  //   merge: any

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
  connect,
  isConnected,
  disconnect,
  getNetwork,
  switchNetwork,
  getAddress,
  getPublicKey,
  getXPublicKey,
  getBalance,
  transfer,
  merge,
  signTransaction,

  eciesEncrypt,
  eciesDecrypt,
  // signTransaction,
  // transferAll,
  token: {
    getBalance: getTokenBalance,
  },
  nft: {},

  btc: {},

  // btc: {
  //   getBalance: () => {},
  //   getAddress: () => {},
  //   getPublicKey: () => {},
  //   getUtxos: () => {},
  // },

  // Deprecating
  requestAccount: connect,
  getAccount: connect,
  exitAccount: disconnect,
  getMvcBalance: getBalance,
  getSensibleFtBalance: getTokenBalance,
}

Object.keys(btcKeys).forEach((type) => {
  const actionType = type as ActionType
  btcKeys[actionType].forEach((item) => {
    metalet['btc'][item.name] = async (params?: any) => {
      return await createAction(item.action, actionType, params)
    }
  })
})

window.metaidwallet = metalet
