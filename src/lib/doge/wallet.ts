/**
 * Dogecoin Wallet Implementation
 * 
 * Handles DOGE address generation, private key derivation, and transaction signing
 * DOGE only supports P2PKH (Legacy) addresses starting with 'D'
 */

import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import BIP32Factory, { BIP32Interface } from 'bip32'
import * as ecc from '@bitcoinerlab/secp256k1'
import * as bitcoinjs from 'bitcoinjs-lib'
import ECPairFactory, { ECPairInterface } from 'ecpair'
import { Buffer } from 'buffer'
import Decimal from 'decimal.js'

import { getDogeNetwork, getDogeDerivationPath, DOGE_COIN_TYPE } from './network'
import { getNet } from '@/lib/network'
import { type Net } from '@metalet/utxo-wallet-service'

const ECPair = ECPairFactory(ecc)
const bip32 = BIP32Factory(ecc)

// DOGE network type - can be livenet (mainnet) or testnet
type DogeNetworkType = 'livenet' | 'testnet'

export interface DogeUTXO {
  txId: string
  outputIndex: number
  satoshis: number
  address: string
  rawTx?: string
  confirmed?: boolean
  height?: number
}

export interface DogeTransferOutput {
  address: string
  satoshis: number
}

export interface DogeSignResult {
  txId: string
  rawTx: string
  fee: number
}

export class DogeWallet {
  private mnemonic: string
  private network: DogeNetworkType
  private addressIndex: number
  private child: BIP32Interface
  private dogeNetwork: bitcoinjs.Network

  constructor(options: {
    mnemonic: string
    network?: DogeNetworkType
    addressIndex?: number
  }) {
    this.mnemonic = options.mnemonic
    const netValue = getNet()
    this.network = options.network || (netValue === 'livenet' ? 'livenet' : 'testnet')
    this.addressIndex = options.addressIndex ?? 0
    this.dogeNetwork = getDogeNetwork(this.network)
    
    // Derive the child key
    const path = getDogeDerivationPath(this.addressIndex)
    this.child = this.deriveChild(path)
  }

  /**
   * Derive child key from mnemonic and path
   */
  private deriveChild(path: string): BIP32Interface {
    if (!bip39.validateMnemonic(this.mnemonic, wordlist)) {
      throw new Error('Invalid mnemonic')
    }
    
    const seed = bip39.mnemonicToSeedSync(this.mnemonic)
    const seedBuf = Buffer.from(seed)
    const master = bip32.fromSeed(seedBuf, this.dogeNetwork)
    
    return master.derivePath(path)
  }

  /**
   * Get DOGE address (P2PKH only)
   */
  getAddress(): string {
    const { payments } = bitcoinjs
    const payment = payments.p2pkh({ 
      pubkey: this.child.publicKey, 
      network: this.dogeNetwork 
    })
    
    if (!payment.address) {
      throw new Error('Failed to generate DOGE address')
    }
    
    return payment.address
  }

  /**
   * Get public key
   */
  getPublicKey(): Buffer {
    return this.child.publicKey
  }

  /**
   * Get public key as hex string
   */
  getPublicKeyHex(): string {
    return this.child.publicKey.toString('hex')
  }

  /**
   * Get private key in WIF format
   */
  getPrivateKeyWIF(): string {
    return this.child.toWIF()
  }

  /**
   * Get network
   */
  getNetwork(): bitcoinjs.Network {
    return this.dogeNetwork
  }

  /**
   * Get ECPair signer for signing transactions
   */
  getSigner(): ECPairInterface {
    return ECPair.fromWIF(this.child.toWIF(), this.dogeNetwork)
  }

  /**
   * Calculate total satoshis from UTXOs
   */
  private getTotalSatoshi(utxos: DogeUTXO[]): Decimal {
    return utxos.reduce((total, utxo) => total.add(utxo.satoshis), new Decimal(0))
  }

  /**
   * Estimate transaction fee
   * DOGE typically uses 1 DOGE/KB minimum fee
   * feeRate is in satoshis per KB (e.g., 100000 = 0.001 DOGE/KB)
   */
  private estimateFee(inputCount: number, outputCount: number, feeRate: number): number {
    // P2PKH input: ~148 bytes, P2PKH output: ~34 bytes, overhead: ~10 bytes
    const estimatedSize = inputCount * 148 + outputCount * 34 + 10
    // feeRate is sat/KB, convert to sat/byte by dividing by 1000
    const feeRatePerByte = feeRate / 1000
    return Math.ceil(estimatedSize * feeRatePerByte)
  }

  /**
   * Build and sign a DOGE transaction
   */
  async signTransaction(options: {
    utxos: DogeUTXO[]
    outputs: DogeTransferOutput[]
    feeRate: number
    changeAddress?: string
  }): Promise<DogeSignResult> {
    const { utxos, outputs, feeRate, changeAddress } = options
    
    if (!utxos.length) {
      throw new Error('No UTXOs available')
    }

    const { payments, Psbt, Transaction } = bitcoinjs
    const address = this.getAddress()
    const payment = payments.p2pkh({ 
      pubkey: this.child.publicKey, 
      network: this.dogeNetwork 
    })

    // Calculate total output amount
    const totalOutput = outputs.reduce((sum, out) => sum.add(out.satoshis), new Decimal(0))
    const totalInput = this.getTotalSatoshi(utxos)

    // Estimate fee
    const outputCount = outputs.length + 1 // +1 for potential change output
    const estimatedFee = this.estimateFee(utxos.length, outputCount, feeRate)

    // Check if we have enough balance
    if (totalInput.lt(totalOutput.add(estimatedFee))) {
      throw new Error('Insufficient balance')
    }

    // Build the transaction using Psbt
    const psbt = new Psbt({ network: this.dogeNetwork })

    // Add inputs
    for (const utxo of utxos) {
      if (!utxo.rawTx) {
        throw new Error(`Raw transaction required for UTXO ${utxo.txId}`)
      }
      
      const tx = Transaction.fromHex(utxo.rawTx)
      psbt.addInput({
        hash: utxo.txId,
        index: utxo.outputIndex,
        nonWitnessUtxo: tx.toBuffer(),
      })
    }

    // Add outputs
    for (const output of outputs) {
      psbt.addOutput({
        address: output.address,
        value: output.satoshis,
      })
    }

    // Add change output if needed
    const change = totalInput.minus(totalOutput).minus(estimatedFee)
    if (change.gt(100000)) { // Only add change if it's more than dust (0.001 DOGE)
      psbt.addOutput({
        address: changeAddress || address,
        value: change.toNumber(),
      })
    }

    // Sign all inputs
    const signer = this.getSigner()
    psbt.signAllInputs(signer)
    psbt.finalizeAllInputs()

    // Extract the transaction
    const tx = psbt.extractTransaction()
    const rawTx = tx.toHex()
    const txId = tx.getId()

    // Calculate actual fee
    const actualFee = totalInput.minus(
      tx.outs.reduce((sum, out) => sum + out.value, 0)
    ).toNumber()

    return {
      txId,
      rawTx,
      fee: actualFee,
    }
  }

  /**
   * Sign a message with the private key
   */
  signMessage(message: string): string {
    const signer = this.getSigner()
    const messageHash = bitcoinjs.crypto.sha256(Buffer.from(message))
    const signature = signer.sign(messageHash)
    return signature.toString('hex')
  }
}

/**
 * Derive DOGE address from mnemonic
 */
export function deriveDogeAddress(
  mnemonic: string, 
  network: DogeNetworkType, 
  addressIndex: number = 0
): string {
  const wallet = new DogeWallet({ mnemonic, network, addressIndex })
  return wallet.getAddress()
}

/**
 * Derive DOGE public key from mnemonic
 */
export function deriveDogePublicKey(
  mnemonic: string, 
  network: DogeNetworkType, 
  addressIndex: number = 0
): string {
  const wallet = new DogeWallet({ mnemonic, network, addressIndex })
  return wallet.getPublicKeyHex()
}

/**
 * Validate DOGE address
 */
export function isValidDogeAddress(address: string, network: DogeNetworkType = 'livenet'): boolean {
  try {
    const dogeNetwork = getDogeNetwork(network)
    // DOGE mainnet addresses start with 'D' or '9'/'A' for script hash
    // DOGE testnet addresses start with 'n'
    if (network === 'livenet') {
      if (!address.startsWith('D') && !address.startsWith('9') && !address.startsWith('A')) {
        return false
      }
    } else {
      if (!address.startsWith('n')) {
        return false
      }
    }
    
    // Try to decode the address
    bitcoinjs.address.toOutputScript(address, dogeNetwork)
    return true
  } catch {
    return false
  }
}
