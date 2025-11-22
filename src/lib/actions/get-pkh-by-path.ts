import type { Chain } from '../types'
import BIP32Factory from 'bip32'
import { decrypt } from '@/lib/crypto'
import { createHash } from 'crypto'
import * as ecc from '@bitcoinerlab/secp256k1'
import { derivePrivateKey } from '../bip32-deriver'
import { getNet } from '../network'
import { getActiveWallet } from '../wallet'
import * as bip39 from 'bip39'

export async function process({ path = 'm/100/0' }: { path?: string }, { password }: { password: string }) {
  const activeWallet = await getActiveWallet()
  const mnemonic = decrypt(activeWallet.mnemonic, password)
  const seed = bip39.mnemonicToSeedSync(mnemonic) // 这将生成 64 字节的种子
  const bip32 = BIP32Factory(ecc)
  const root = bip32.fromSeed(seed)
  // 2. 派生子密钥
  const child = root.derivePath(path)

  // 3. 获取压缩公钥
  const pubKey = child.publicKey // <Buffer 02 ... >

  // 4. sha256
  const sha256 = createHash('sha256').update(pubKey).digest()

  // 5. ripemd160
  const pkh = createHash('ripemd160').update(sha256).digest() // 20 bytes

  const pkhHex = pkh.toString('hex') // 这里将 Buffer 转为 hex 字符串

  return pkhHex
}
