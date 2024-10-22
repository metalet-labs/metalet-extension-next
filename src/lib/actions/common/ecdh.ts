import * as bip39 from 'bip39'
import * as bip32 from 'bip32'
import * as ecdh from 'crypto'
import { getCurrentWallet } from '@/lib/wallet';
import { Chain } from '@metalet/utxo-wallet-service';

export async function process(
  _: unknown,
  { path = "m/100'/0'/0'/0/0", password }: { path?: string; password: string }
) {

  const wallet= await getCurrentWallet(Chain.BTC)
  // 助记词
  const mnemonic = 'your mnemonic phrase here'

  // 根据助记词生成种子
  const seed = bip39.mnemonicToSeedSync()

  // 使用BIP32生成HD钱包节点
  const root = bip32.fromSeed(seed)

  const keyPair = root.derivePath(path)

  // 导出私钥和公钥
  const privateKey = keyPair.privateKey
  const publicKey = keyPair.publicKey

  // 外部传入的公钥，示例为 hex 编码公钥
  const externalPubKey = Buffer.from('external public key in hex', 'hex')

  // 使用ECDH生成协商密钥
  const ecdhKey = ecdh.createECDH('secp256k1')
  ecdhKey.setPrivateKey(privateKey)

  // 返回协商密钥
  const sharedSecret = ecdhKey.computeSecret(externalPubKey)

  return sharedSecret.toString('hex')
}
