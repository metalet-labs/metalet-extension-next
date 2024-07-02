import { UTXO } from '@/queries/utxos'
import useStorage from './storage'

const storage = useStorage()

const MetaIdPin_UTXO_KEY = 'MetaIdPin_UTXO_LIST'

export const getMetaIdPinUnspentOutputsObj = async () => {
  return await storage.get<{ [address: string]: string[] }>(MetaIdPin_UTXO_KEY, {
    defaultValue: {},
  })
}

export const setMetaIdPinUnspentOutputsObj = async (utxosStorage: { [address: string]: string[] }) => {
  await storage.set(MetaIdPin_UTXO_KEY, utxosStorage)
}

export const getMetaIdPinSafeUtxos = async (address: string, utxos: UTXO[]) => {
  const metaIdPinUnspentOutputsObj = await getMetaIdPinUnspentOutputsObj()
  const btcUnspentOutputs = utxos.map((utxo) => `${utxo.txId}:${utxo.outputIndex}`)
  let metaIdPinUnspentOutputs = metaIdPinUnspentOutputsObj[address] || []
  metaIdPinUnspentOutputs = metaIdPinUnspentOutputs.filter((unspentOutputs) =>
    btcUnspentOutputs.includes(unspentOutputs)
  )
  return utxos.filter((utxo) => utxo.confirmed || metaIdPinUnspentOutputs.includes(`${utxo.txId}:${utxo.outputIndex}`))
}
