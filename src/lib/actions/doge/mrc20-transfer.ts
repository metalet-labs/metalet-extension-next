/**
 * DOGE MRC20 Transfer
 */

import { getDogeWallet } from './wallet'
import { fetchDogeUtxos } from '@/queries/doge'
import { getMRC20Utxos } from '@/queries/mrc20'
import type { UTXO } from '@/queries/utxos'
import { SignType, Transaction, getAddressFromScript } from '@metalet/utxo-wallet-service'
import { addSafeUtxo } from '@/lib/utxo'

export interface DogeMRC20TransferParams {
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
  utxos?: UTXO[]
}

export async function process(params: DogeMRC20TransferParams) {
  const wallet = await getDogeWallet()
  const address = wallet.getAddress()
  const utxos = params.utxos || (await fetchDogeUtxos(wallet.getAddress(), true))

  const mrc20Utxos = await getMRC20Utxos(
    wallet.getAddress(),
    params.mrc20TickId,
    true, // DOGE only supports P2PKH
    'doge'
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
