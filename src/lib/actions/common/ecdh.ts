import * as ecdh from 'crypto'
import { getNet } from '@/lib/network'
import { getActiveWallet } from '@/lib/wallet'
import { AddressType, BaseWallet, ScriptType } from '@metalet/utxo-wallet-service'

export async function process(
  _: unknown,
  { path = "m/100'/0'/0'/0/0", externalPubKey }: { path?: string; externalPubKey: string }
) {
  const network = getNet()
  const activeWallet = await getActiveWallet()

  const wallet = new BaseWallet({
    // @ts-ignore
    path,
    network,
    addressIndex: 0,
    scriptType: ScriptType.P2PKH,
    mnemonic: activeWallet.mnemonic,
    addressType: AddressType.Legacy,
  })

  const privateKey = wallet.getPrivateKeyBuffer()

  const _externalPubKey = Buffer.from(externalPubKey, 'hex')

  const ecdhKey = ecdh.createECDH('secp256k1')
  // @ts-ignore
  ecdhKey.setPrivateKey(privateKey)

  // 返回协商密钥
  const sharedSecret = ecdhKey.computeSecret(_externalPubKey)

  return sharedSecret.toString('hex')
}
