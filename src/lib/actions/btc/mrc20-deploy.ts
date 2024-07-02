import { getBtcUtxos } from '@/queries/utxos'
import { getCurrentWallet } from '../../wallet'
import { broadcastBTCTx } from '@/queries/transaction'
import { getSafeUtxos, addSafeUtxo } from '@/lib/utxo'
import { Chain, ScriptType, SignType, Transaction, getAddressFromScript } from '@metalet/utxo-wallet-service'

export interface MRC20DeployParams {
  body: {
    tick: string
    tokenName: string
    decimals: string
    amtPerMint: string
    mintCount: string
    premineCount: string
    blockheight: string
    metadata?: string
    qual: {
      path?: string
      count?: string
      lvl?: string
    }
  }
  flag?: 'metaid' | 'testid'
  revealAddr?: string
  commitFeeRate: number
  revealFeeRate: number
  changeAddress?: string
  revealOutValue?: number
  preMined?: {
    address: string
    satoshis: number
  }
  service?: {
    address: string
    satoshis: string
  }
}

interface Options {
  markSafe?: boolean
  noBroadcast?: boolean
}

export async function process({ options, ...params }: MRC20DeployParams & { options?: Options }) {
  const wallet = await getCurrentWallet(Chain.BTC)
  const address = wallet.getAddress()
  const utxos = await getBtcUtxos(address, wallet.getScriptType() === ScriptType.P2PKH, true)
  const safeUtxos = await getSafeUtxos(address, utxos)
  const { commitTx, revealTx } = wallet.signTx(SignType.MRC20_DEPLOY, {
    ...params,
    utxos: safeUtxos,
  })
  if (!options?.noBroadcast) {
    const commitTxId = await broadcastBTCTx(commitTx.rawTx)
    const tx = Transaction.fromHex(commitTx.rawTx)
    if (
      tx.outs.length > 1 &&
      getAddressFromScript(tx.outs[tx.outs.length - 1].script, wallet.getNetwork()) === address
    ) {
      await addSafeUtxo(address, `${commitTxId}:${tx.outs.length - 1}`)
    }
    await broadcastBTCTx(revealTx.rawTx)
  } else if (options?.markSafe) {
    await addSafeUtxo(address, `${commitTx.txId}:${Transaction.fromHex(commitTx.rawTx).outs.length - 1}`)
  }

  return { commitTx, revealTx }
}
