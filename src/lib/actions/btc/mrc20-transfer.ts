import { addSafeUtxo } from '@/lib/utxo'
import { getCurrentWallet } from '../../wallet'
import { getBtcUtxos, getMRC20Utxos } from '@/queries/utxos'
import { Chain, ScriptType, SignType, Transaction, getAddressFromScript } from '@metalet/utxo-wallet-service'

export interface MRC20TransferParams {
  body: string
  amount: string
  mrc20TickId: string
  flag?: 'metaid'
  revealAddr?: string
  commitFeeRate: number
  revealFeeRate: number
  changeAddress?: string
  revealOutValue?: number
  service?: {
    address: string
    satoshis: string
  }
}

export async function process(params: MRC20TransferParams) {
  const wallet = await getCurrentWallet(Chain.BTC)
  const address = wallet.getAddress()
  const utxos = await getBtcUtxos(wallet.getAddress(), wallet.getScriptType() === ScriptType.P2PKH, true)

  const mrc20Utxos = await getMRC20Utxos(
    wallet.getAddress(),
    params.mrc20TickId,
    wallet.getScriptType() === ScriptType.P2PKH
  )

  const { commitTx, revealTx } = wallet.signTx(SignType.MRC20_TRANSFER, {
    ...params,
    mrc20Utxos,
    utxos,
  })

  const tx = Transaction.fromHex(commitTx.rawTx)
  if (tx.outs.length > 1 && getAddressFromScript(tx.outs[tx.outs.length - 1].script, wallet.getNetwork()) === address) {
    await addSafeUtxo(address, `${commitTx.txId}:${tx.outs.length - 1}`)
  }

  return { commitTx, revealTx }
}
