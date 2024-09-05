import { getCurrentWallet } from '../../wallet'
import { Chain } from '@metalet/utxo-wallet-service'
import { type AddressType, scripts } from '@/lib/bip32-deriver'

export async function process(
  _: unknown,
  { password }: { password: string }
): Promise<
  | {
      name: string
      path: string
      addressType: AddressType
    }
  | undefined
> {
  const wallet = await getCurrentWallet(Chain.BTC, { password })
  const addressType = wallet.getScriptType()
  return scripts.find((script) => script.addressType === addressType)
}
