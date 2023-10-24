import { Chain } from '@/lib/account'
import { mvcApi, metaletApiV2 } from './request'

export interface UTXO {
  address: string
  codeType: number
  height: number
  idx: number
  inscriptions: string[]
  isOpInRBF: boolean
  satoshi: number
  scriptPk: string
  scriptType: string
  txId: string
  vout: number
}

const fetchMVCUtxos = async (address: string): Promise<any[]> => {
  return await mvcApi(`/address/${address}/utxo`).get()
}

// Fetch BTC address non inscription UTXO utxos
const fetchBTCUtxos = async (address: string): Promise<UTXO[]> => {
  const {
    data: { utxo },
  } = await metaletApiV2(`/address/utxos`).get({
    address,
    chain: 'btc',
  })

  return utxo
}

export const fetchUtxos = async (chain: Chain = 'mvc', address: string): Promise<any[]> => {
  if (chain === 'mvc') {
    return await fetchMVCUtxos(address)
  } else {
    return await fetchBTCUtxos(address)
  }
}
