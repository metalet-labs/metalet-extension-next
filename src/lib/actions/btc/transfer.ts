import { getUtxos } from '@/queries/utxos'
import { getCurrentWallet } from '@/lib/wallet'
import { Chain } from '@metalet/utxo-wallet-service'
import { broadcastBTCTx, getBTCTRate } from '@/queries/transaction'
import Decimal from 'decimal.js'

interface TransferParameters {
  toAddress: string
  satoshis: string
  options?: { noBroadcast?: boolean; feeRate?: string | number }
}

export async function process(params: TransferParameters): Promise<{ txId: string } | { txHex: string }> {
  const wallet = await getCurrentWallet(Chain.BTC)

  let feeRate = params.options?.feeRate

  if (!feeRate) {
    const { list } = await getBTCTRate()
    feeRate = list.find((item) => item.title === 'Avg')?.feeRate
    throw Error('Request feeRate Error')
  }

  feeRate = Number(feeRate)
  const utxos = await getUtxos(wallet.getAddress())

  const { psbt, rawTx } = wallet.send(
    params.toAddress,
    new Decimal(params.satoshis).div(1e8).toString(),
    feeRate,
    utxos
  )
  if (params.options?.noBroadcast) {
    return { txHex: psbt.extractTransaction().toHex() }
  }
  const txId = await broadcastBTCTx(rawTx)
  return { txId }
}
