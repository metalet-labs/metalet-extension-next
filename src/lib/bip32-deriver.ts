import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import BIP32Factory, { BIP32Interface } from 'bip32'
import * as ecc from '@bitcoinerlab/secp256k1'
import { mvc } from 'meta-contract'
import * as bitcoinjs from 'bitcoinjs-lib'
import type { Payment, Network as btcNetwork } from 'bitcoinjs-lib'
import ECPairFactory from 'ecpair'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'

import { raise } from './helpers'
import { type Network, getBtcNetwork } from './network'
import { getPublicKey } from './account'
import { Buffer } from 'buffer'
import { getCurrentWallet } from './wallet'

export { ScriptType as AddressType }

export const scripts: {
  name: string
  path: string
  addressType: ScriptType
}[] = [
  {
    name: 'Native Segwit',
    addressType: ScriptType.P2WPKH,
    path: "m/84'/0'/0'/0/0",
  },
  {
    name: 'Nested Segwit',
    addressType: ScriptType.P2SH_P2WPKH,
    path: "m/49'/0'/0'/0/0",
  },
  {
    name: 'Taproot',
    addressType: ScriptType.P2TR,
    path: "m/86'/0'/0'/0/0",
  },
  {
    name: 'Legacy',
    addressType: ScriptType.P2PKH,
    path: "m/44'/0'/0'/0/0",
  },
  {
    name: 'Same as MVC',
    addressType: ScriptType.P2PKH,
    path: "m/44'/0'/0'/0/0",
  },
]

// private key
export function derivePrivateKey({
  mnemonic,
  chain,
  network,
  path,
}: {
  mnemonic: string
  chain: 'mvc' | 'btc'
  network: Network
  path: string
}): string {
  bip39.validateMnemonic(mnemonic, wordlist) ?? raise('Invalid mnemonic')

  if (chain === 'mvc') {
    return deriveMvcPrivateKey(mnemonic, path, network).toString()
  }

  return deriveBtcPrivateKey(mnemonic, path, network).toWIF()
}

// FIXME support MVC and discard ECPairFactory
export async function deriveSigner(privateKey: string, network: btcNetwork) {
  const ECPair = ECPairFactory(ecc)
  return ECPair.fromWIF(privateKey, network)
}

function deriveMvcPrivateKey(mnemonic: string, path: string, network: Network): mvc.PrivateKey {
  const mneObj = mvc.Mnemonic.fromString(mnemonic)
  const hdpk = mneObj.toHDPrivateKey('', network)

  return hdpk.deriveChild(path).privateKey
}

export function deriveBtcPrivateKey(mnemonic: string, path: string, network: Network): BIP32Interface {
  const bip32 = BIP32Factory(ecc)
  const btcNetwork = network === 'mainnet' ? bitcoinjs.networks.bitcoin : bitcoinjs.networks.testnet
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const seedBuf = Buffer.from(seed)
  const master = bip32.fromSeed(seedBuf, btcNetwork)

  return master.derivePath(path)
}

// public key
export function derivePublicKey({
  mnemonic,
  chain,
  network,
  path,
}: {
  mnemonic: string
  chain: 'mvc' | 'btc'
  network: Network
  path: string
}): string {
  bip39.validateMnemonic(mnemonic, wordlist) ?? raise('Invalid mnemonic')

  if (chain === 'mvc') {
    return deriveMvcPublicKey(mnemonic, path, network).toString()
  }

  return deriveBtcPublicKey(mnemonic, path, network).toString('hex')
}

function deriveMvcPublicKey(mnemonic: string, path: string, network: Network): mvc.PublicKey {
  const privateKey = deriveMvcPrivateKey(mnemonic, path, network)

  return privateKey.toPublicKey()
}

function deriveBtcPublicKey(mnemonic: string, path: string, network: Network): Buffer {
  const child = deriveBtcPrivateKey(mnemonic, path, network)

  return child.publicKey
}

// address
export function deriveAllAddresses({
  mnemonic,
  btcPath,
  mvcPath,
}: {
  mnemonic: string
  btcPath: string
  mvcPath: string
}) {
  bip39.validateMnemonic(mnemonic, wordlist) ?? raise('Invalid mnemonic')

  const mvcTestnetAddress = deriveMvcAddress(mnemonic, mvcPath, 'testnet')
  const mvcMainnetAddress = deriveMvcAddress(mnemonic, mvcPath, 'mainnet')
  const btcTestnetAddress = deriveBtcAddress(mnemonic, btcPath, 'testnet')
  const btcMainnetAddress = deriveBtcAddress(mnemonic, btcPath, 'mainnet')

  return {
    mvcTestnetAddress,
    mvcMainnetAddress,
    btcTestnetAddress,
    btcMainnetAddress,
  }
}

export function deriveAddress({
  mnemonic,
  chain,
  network,
  path,
}: {
  mnemonic: string
  chain: 'mvc' | 'btc'
  network: Network
  path: string
}): string {
  bip39.validateMnemonic(mnemonic, wordlist) ?? raise('Invalid mnemonic')

  if (chain === 'mvc') {
    return deriveMvcAddress(mnemonic, path, network)
  }

  return deriveBtcAddress(mnemonic, path, network)
}

function deriveMvcAddress(mnemonic: string, path: string, network: Network): string {
  const privateKey = deriveMvcPrivateKey(mnemonic, path, network)

  return privateKey.toAddress(network === 'regtest' ? 'testnet' : network).toString()
}

function deriveBtcAddress(mnemonic: string, path: string, network: Network): string {
  bitcoinjs.initEccLib(ecc)
  const { networks, payments } = bitcoinjs

  const child = deriveBtcPrivateKey(mnemonic, path, network)
  const btcNetwork = network === 'mainnet' ? networks.bitcoin : networks.testnet
  const publicKey = child.publicKey

  // Infer address type based on path
  const addressType = inferAddressType(path)

  switch (addressType) {
    case ScriptType.P2PKH:
      return payments.p2pkh({ pubkey: publicKey, network: btcNetwork }).address ?? raise('Invalid address')
    case ScriptType.P2SH_P2WPKH:
      return payments.p2sh({ redeem: payments.p2wpkh({ pubkey: publicKey }) }).address ?? raise('Invalid address')
    case ScriptType.P2WPKH:
      return payments.p2wpkh({ pubkey: publicKey, network: btcNetwork }).address ?? raise('Invalid address')
    case ScriptType.P2TR:
      return (
        payments.p2tr({ internalPubkey: publicKey.subarray(1), network: btcNetwork }).address ??
        raise('Invalid address')
      )
  }
}

// TODO support deriveBtcAddress function
export async function createPayment(addressType: string): Promise<Payment> {
  bitcoinjs.initEccLib(ecc)
  const wallet = await getCurrentWallet(Chain.BTC)
  const { payments } = bitcoinjs
  const btcNetwork = await getBtcNetwork()
  const pubkey = wallet.getPublicKey()

  switch (addressType) {
    case ScriptType.P2PKH:
      return payments.p2pkh({ pubkey, network: btcNetwork }) ?? raise('Invalid Payment')
    case ScriptType.P2SH_P2WPKH:
      return payments.p2sh({ redeem: payments.p2wpkh({ pubkey }) }) ?? raise('Invalid Payment')
    case ScriptType.P2WPKH:
      return payments.p2wpkh({ pubkey, network: btcNetwork }) ?? raise('Invalid Payment')
    case ScriptType.P2TR:
      return payments.p2tr({ internalPubkey: pubkey.subarray(1), network: btcNetwork }) ?? raise('Invalid Payment')
    default:
      return payments.p2pkh({ pubkey, network: btcNetwork }) ?? raise('Invalid Payment')
  }
}

export function inferAddressType(path: string): ScriptType {
  const pathProtocolNumber = parseInt(path.split('/')[1].replace("'", ''), 10)
  let addressType: ScriptType
  switch (pathProtocolNumber) {
    case 44:
      addressType = ScriptType.P2PKH
      break
    case 49:
      addressType = ScriptType.P2SH_P2WPKH
      break
    case 84:
      addressType = ScriptType.P2WPKH
      break
    case 86:
      addressType = ScriptType.P2TR
      break
    default:
      addressType = ScriptType.P2PKH
  }

  return addressType
}

export function* inferDerivationPath(
  mnemonic: string,
  targetAddress: string
): Generator<{
  status: 'progress' | 'failed' | 'success'
  path: string
}> {
  const commonSymbols = [0, 236, 10001]
  let chainSymbol: number = 0

  // first try common paths
  for (let i = 0; i < commonSymbols.length; i++) {
    const basePath = `m/44'/${commonSymbols[i]}'/0'`
    const path = `${basePath}/0/0`

    yield {
      status: 'progress',
      path: basePath,
    }

    const address = deriveMvcAddress(mnemonic, path, 'mainnet')
    if (address === targetAddress) {
      yield {
        status: 'success',
        path: basePath,
      }
    }
  }

  // if not found, try all paths
  chainSymbol = 0
  while (chainSymbol < 20000) {
    const basePath = `m/44'/${chainSymbol}'/0'`
    const path = `${basePath}/0/0`
    yield {
      status: 'progress',
      path: basePath,
    }

    const address = deriveMvcAddress(mnemonic, path, 'mainnet')
    if (address === targetAddress) {
      yield {
        status: 'success',
        path: basePath,
      }
    }
    chainSymbol += 1
  }

  return {
    status: 'failed',
    path: '',
  }
}
