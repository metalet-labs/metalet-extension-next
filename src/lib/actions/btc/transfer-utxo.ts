import { getCurrentWallet } from '@/lib/wallet'
import { getBtcUtxos, UTXO } from '@/queries/utxos'
import { broadcastBTCTx, getBTCTRate } from '@/queries/transaction'
import { Chain, ScriptType, SignType } from '@metalet/utxo-wallet-service'

interface TransferParameters {
  recipient: string
  transferUTXOs: UTXO[]
  changeAddress?: string
  options?: { noBroadcast?: boolean; feeRate?: string | number; useUnconfirmed?: boolean }
}

export async function process({
  options,
  recipient,
  transferUTXOs,
  changeAddress,
}: TransferParameters): Promise<{ txId: string } | { txHex: string }> {
  const wallet = await getCurrentWallet(Chain.BTC)
  const address = wallet.getAddress()

  let feeRate = options?.feeRate

  if (!feeRate) {
    const { list } = await getBTCTRate()
    feeRate = list.find((item) => item.title === 'Avg')?.feeRate
    throw Error('Request feeRate Error')
  }

  feeRate = Number(feeRate)

  const utxos = await getBtcUtxos(
    wallet.getAddress(),
    wallet.getScriptType() === ScriptType.P2PKH,
    options?.useUnconfirmed
  )

  const { rawTx } = wallet.signTx(SignType.Transfer, {
    utxos,
    feeRate,
    recipient,
    changeAddress,
    transferUTXOs,
  })

  if (options?.noBroadcast) {
    return { txHex: rawTx }
  }

  const txId = await broadcastBTCTx(rawTx)
  return { txId }
}
