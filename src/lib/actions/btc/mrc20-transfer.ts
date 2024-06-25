import { getCurrentWallet } from '../../wallet'
import { Chain, ScriptType, SignType } from '@metalet/utxo-wallet-service'
import { type AddressType } from '@/lib/bip32-deriver'
import { UTXO, getBtcUtxos, getMRC20Utxos } from '@/queries/utxos'

export interface MRC20TransferParams {
  body: string
  mrc20TickId: string
  flag?: 'metaid' | 'testid'
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

export async function process(params: MRC20TransferParams): Promise<
  | {
      name: string
      path: string
      addressType: AddressType
    }
  | undefined
> {
  const wallet = await getCurrentWallet(Chain.BTC)
  const utxos = await getBtcUtxos(wallet.getAddress(), wallet.getScriptType() === ScriptType.P2PKH)

  const mrc20Utxos = await getMRC20Utxos(
    wallet.getAddress(),
    params.mrc20TickId,
    wallet.getScriptType() === ScriptType.P2PKH
  )

  return wallet.signTx(SignType.MRC20_TRANSFER, {
    ...params,
    // @ts-ignore
    mrc20Utxos,
    utxos,
  })
}
