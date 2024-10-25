import * as crypto from 'crypto'
import { getNet } from '@/lib/network'
import { decrypt } from '@/lib/crypto'
import { getActiveWallet } from '@/lib/wallet'
import { AddressType, BaseWallet, ScriptType } from '@metalet/utxo-wallet-service'

export async function process(
  { path = "m/100'/0'/0'/0/0", externalPubKey }: { path?: string; externalPubKey: string },
  { password }: { password: string }
) {
  const network = getNet()
  const activeWallet = await getActiveWallet()
  const mnemonic = decrypt(activeWallet.mnemonic, password)

  const wallet = new BaseWallet({
    // @ts-ignore
    path,
    network,
    mnemonic,
    addressIndex: 0,
    scriptType: ScriptType.P2PKH,
    addressType: AddressType.Legacy,
  })

  const privateKey = wallet.getPrivateKeyBuffer()

  const _externalPubKey = Buffer.from(externalPubKey, 'hex')

  const ecdh = crypto.createECDH('prime256v1')
  ecdh.setPrivateKey(privateKey!)

  const _sharedSecret = ecdh.computeSecret(_externalPubKey)

  const sharedSecret = crypto.createHash('sha256').update(_sharedSecret).digest()

  return { sharedSecret: sharedSecret.toString('hex'), externalPubKey }
}
