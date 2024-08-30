import Decimal from 'decimal.js'
import { addSafeUtxo } from '@/lib/utxo'
import { getBtcUtxos } from '@/queries/utxos'
import { getCurrentWallet } from '@/lib/wallet'
import { broadcastBTCTx, getBTCTRate } from '@/queries/transaction'
import { Chain, ScriptType, SignType, Transaction, getAddressFromScript } from '@metalet/utxo-wallet-service'

interface TransferParameters {
  toAddress: string
  satoshis: string
  options?: { noBroadcast?: boolean; feeRate?: string | number }
}

export async function process(params: TransferParameters): Promise<{ txId: string } | { txHex: string }> {
  const wallet = await getCurrentWallet(Chain.BTC)
  const address = wallet.getAddress()

  let feeRate = params.options?.feeRate

  if (!feeRate) {
    const { list } = await getBTCTRate()
    feeRate = list.find((item) => item.title === 'Avg')?.feeRate
    throw Error('Request feeRate Error')
  }

  feeRate = Number(feeRate)

  const utxos = await getBtcUtxos(wallet.getAddress(), wallet.getScriptType() === ScriptType.P2PKH, true)

  const { rawTx } = wallet.signTx(SignType.SEND, {
    utxos,
    feeRate,
    outputs: [{ address: params.toAddress, satoshis: new Decimal(params.satoshis).toNumber() }],
  })

  if (params.options?.noBroadcast) {
    return { txHex: rawTx }
  }

  const txId = await broadcastBTCTx(rawTx)
  const tx = Transaction.fromHex(rawTx)
  if (tx.outs.length > 1 && getAddressFromScript(tx.outs[tx.outs.length - 1].script, wallet.getNetwork()) === address) {
    await addSafeUtxo(address, `${txId}:${tx.outs.length - 1}`)
  }
  return { txId }
}
