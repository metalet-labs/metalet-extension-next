import { Chain } from '@/lib/types'
import { MRC20UTXO } from './mrc20'
import { getNet } from '@/lib/network'
import { Ref, ComputedRef } from 'vue'
import { getSafeUtxos } from '@/lib/utxo'
import { useQuery } from '@tanstack/vue-query'
import { UNISAT_ENABLED } from '@/data/config'
import { fetchBtcTxHex } from '@/queries/transaction'
import { mvcApi, mempoolApi, metaletApiV3, unisatApi } from './request'

export interface UTXO {
  txId: string
  outputIndex: number
  satoshis: number
  confirmed: boolean
  rawTx?: string
  // inscriptions:
  //   | {
  //       id: string
  //       num: number
  //     }[]
  //   | null
}

export type MvcUtxo = {
  flag: string
  address: string
  txid: string
  outIndex: number
  value: number
  height: number
}

const fetchMVCUtxos = async (address: string): Promise<MvcUtxo[]> => {
  return (await mvcApi<MvcUtxo[]>(`/address/${address}/utxo`)).get()
}

export type Utxo = {
  addressType: number
  outputIndex: number
  satoshis: number
  satoshi: number
  txid: string
  txId: string
  vout: number
}

export const fetchUtxos = async (chain: Chain = 'mvc', address: string): Promise<any[]> => {
  if (chain === 'mvc') {
    return (await fetchMVCUtxos(address)) || []
  } else {
    return (await getBtcUtxos(address)) || []
  }
}

export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
  P2SH_P2WPKH,
  M44_P2WPKH,
  M44_P2TR,
}

export interface UnisatUTXO {
  txid: string
  vout: number
  satoshis: number
  scriptPk: string
  addressType: AddressType
  inscriptions: {
    inscriptionId: string
    inscriptionNumber?: number
    offset: number
  }[]
  atomicals: {
    atomicalId: string
    atomicalNumber: number
    type: 'NFT' | 'FT'
    ticker?: string
  }[]

  runes: {
    runeid: string
    rune: string
    amount: string
  }[]
}

// TODO: add mode
export async function getBtcUtxos(address: string, needRawTx = false, useUnconfirmed = true): Promise<UTXO[]> {
  const net = getNet()
  if (UNISAT_ENABLED) {
    const unisatUtxos = await unisatApi<UnisatUTXO[]>(`/address/btc-utxo`).get({ net, address })
    const utxos = unisatUtxos.map((utxo) => formatUnisatUTXO(utxo))
    utxos.sort((a, b) => {
      if (a.confirmed !== b.confirmed) {
        return b.confirmed ? 1 : -1
      }
      return a.satoshis - b.satoshis
    })

    return utxos.filter((utxo) => utxo.confirmed)
  }
  let utxos = (await metaletApiV3<UTXO[]>('/address/btc-utxo').get({ net, address, unconfirmed: '1' })) || []

  utxos = utxos.filter((utxo) => utxo.satoshis >= 600)

  if (!useUnconfirmed) {
    utxos = utxos.filter((utxo) => utxo.confirmed)
  } else {
    // utxos = await getSafeUtxos(address, utxos)
  }
  if (needRawTx) {
    for (let utxo of utxos) {
      utxo.rawTx = await fetchBtcTxHex(utxo.txId)
    }
  }
  return utxos.sort((a, b) => {
    if (a.confirmed !== b.confirmed) {
      return b.confirmed ? 1 : -1
    }
    return a.satoshis - b.satoshis
  })
}

export async function getAllBtcUtxos(address: string): Promise<UTXO[]> {
  const net = getNet()
  return (await metaletApiV3<UTXO[]>('/address/btc-utxo').get({ net, address, unconfirmed: '1' })) || []
}

export async function getMRC20Utxos(address: string, mrc20TickId: string, needRawTx = false): Promise<MRC20UTXO[]> {
  const net = getNet()

  const { list: utxos } = await metaletApiV3<{
    total: number
    list: MRC20UTXO[]
  }>(`/mrc20/address/utxo`).get({
    net,
    address,
    tickId: mrc20TickId,
  })

  if (needRawTx) {
    for (let utxo of utxos) {
      utxo.rawTx = await fetchBtcTxHex(utxo.txId)
    }
  }
  return utxos.sort((a, b) => {
    if (a.confirmed !== b.confirmed) {
      return b.confirmed ? 1 : -1
    }
    return a.satoshis - b.satoshis
  })
}

export async function getRuneUtxos(address: string, runeId: string, needRawTx = false): Promise<UTXO[]> {
  const net = getNet()
  const res =
    (await metaletApiV3<{
      total: number
      cursor: number
      list: UTXO[]
    }>('/runes/address/utxo').get({ net, address, runeId })) || []
  if (needRawTx) {
    for (let utxo of res.list) {
      utxo.rawTx = await fetchBtcTxHex(utxo.txId)
      utxo.rawTx
    }
  }

  return res.list
}

// export async function getInscriptionUtxos(inscriptions: Inscription[]): Promise<UTXO[]> {
//   const unisatUtxos = await unisatApi<UnisatUTXO[]>('/inscription/utxos').post({
//     inscriptionIds: inscriptions.map((inscription) => inscription.inscriptionId),
//   })
//   const utxos = unisatUtxos.map((utxo) => {
//     const inscriptionIds = utxo.inscriptions.map((inscription) => inscription.id)
//     const inscription = inscriptions.find((inscription) => inscriptionIds.includes(inscription.inscriptionId))!
//     return { ...utxo, confirmed: !!inscription.utxoConfirmation }
//   })
//   return utxos.map((utxo) => formatUnisatUTXO(utxo))
// }

export async function getInscriptionUtxo(inscriptionId: string, needRawTx: boolean = false): Promise<UTXO> {
  const net = getNet()
  const utxo = await metaletApiV3<UTXO>('/inscription/utxo').get({ net, inscriptionId })
  if (needRawTx) {
    utxo.rawTx = await fetchBtcTxHex(utxo.txId)
  }
  return utxo
}

export interface MempoolUtxo {
  txid: string
  vout: number
  status: {
    confirmed: boolean
    block_height?: number
    block_hash?: string
    block_time?: number
  }
  value: number
}

function formatMempoolUTXO(utxo: MempoolUtxo): UTXO {
  return {
    txId: utxo.txid,
    outputIndex: utxo.vout,
    satoshis: utxo.value,
    confirmed: utxo.status.confirmed,
  }
}

function formatUnisatUTXO(utxo: UnisatUTXO): UTXO {
  return {
    txId: utxo.txid,
    outputIndex: utxo.vout,
    satoshis: utxo.satoshis,
    confirmed: true,
  }
}

export async function getUtxos(address: string): Promise<UTXO[]> {
  const utxos = await mempoolApi<MempoolUtxo[]>(`/address/${address}/utxo`).get()
  return utxos.map((utxo) => formatMempoolUTXO(utxo))
}

export const useMVCUtxosQuery = (address: Ref<string>, options: { enabled: ComputedRef<boolean> }) => {
  return useQuery({
    queryKey: ['MVCUTXOs', { address }],
    queryFn: () => fetchMVCUtxos(address.value),
    ...options,
  })
}

export const useBTCUtxosQuery = (
  address: Ref<string>,
  options?: {
    needRawTx?: boolean
    useUnconfirmed?: boolean
    enabled: ComputedRef<boolean>
  }
) => {
  return useQuery({
    queryKey: ['BTC Balance', { address }],
    queryFn: () => {
      return getBtcUtxos(
        address.value,
        options?.needRawTx === undefined ? false : options?.needRawTx,
        options?.useUnconfirmed === undefined ? true : options?.useUnconfirmed
      )
    },
    ...options,
  })
}
