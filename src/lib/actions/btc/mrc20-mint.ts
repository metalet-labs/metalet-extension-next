import { addSafeUtxo } from '@/lib/utxo'
import { getCurrentWallet } from '../../wallet'
import { UTXO, getBtcUtxos } from '@/queries/utxos'
import { Chain, ScriptType, SignType, Transaction, getAddressFromScript } from '@metalet/utxo-wallet-service'

export interface MRC20MintParams {
  id: string
  utxos: UTXO[]
  flag?: 'metaid'
  revealAddr?: string
  contentType?: string
  commitFeeRate: number
  revealFeeRate: number
  changeAddress?: string
  metaIdPinUtxos: UTXO[]
  revealOutValue?: number
  service?: {
    address: string
    satoshis: string
  }
}

export async function process(params: MRC20MintParams) {
  const wallet = await getCurrentWallet(Chain.BTC)
  const address = wallet.getAddress()
  const utxos = await getBtcUtxos(wallet.getAddress(), wallet.getScriptType() === ScriptType.P2PKH, true)

  const { commitTx, revealTx } = wallet.signTx(SignType.MRC20_MINT, {
    ...params,
    utxos,
  })

  const tx = Transaction.fromHex(commitTx.rawTx)
  if (tx.outs.length > 1 && getAddressFromScript(tx.outs[tx.outs.length - 1].script, wallet.getNetwork()) === address) {
    await addSafeUtxo(address, `${commitTx.txId}:${tx.outs.length - 1}`)
  }

  return { commitTx, revealTx }
}
