/**
 * DOGE Complete Transaction Action
 *
 * Accepts a partial transaction (txHex with outputs) and automatically
 * selects inputs (UTXOs) and adds change output based on fee rate.
 */

import Decimal from 'decimal.js'
import { getDogeWallet } from './wallet'
import { fetchDogeUtxos } from '@/queries/doge/utxos'
import { broadcastDogeTx } from '@/queries/doge/transaction'
import { Transaction, Psbt } from 'bitcoinjs-lib'
import { getDogeNetwork } from '@/lib/doge/network'
import { getNetwork } from '@/lib/network'

// DOGE dust limit: 0.001 DOGE = 100,000 satoshis
const DUST_LIMIT = 100000

// Estimation constants for P2PKH
const TX_OVERHEAD = 10 // version + locktime + input/output count
const INPUT_SIZE = 148 // P2PKH input size
const OUTPUT_SIZE = 34 // P2PKH output size

export interface CompleteTxParams {
  txHex: string
  feeRate: number // sat/KB
  options?: {
    noBroadcast?: boolean
    changeAddress?: string
  }
}

export interface CompleteTxResult {
  txId: string
  rawTx: string
  fee: number
  inputs: Array<{ txId: string; outputIndex: number; address: string; satoshis: number }>
  outputs: Array<{ address: string; satoshis: number }>
}

/**
 * Parse outputs from a raw transaction hex
 */
export function parseOutputsFromTxHex(
  txHex: string,
  network: ReturnType<typeof getDogeNetwork>
): Array<{ address: string; satoshis: number; script: string }> {
  const tx = Transaction.fromHex(txHex)
  const outputs: Array<{ address: string; satoshis: number; script: string }> = []

  for (const out of tx.outs) {
    let address = ''
    try {
      const { address: addressLib } = require('bitcoinjs-lib')
      address = addressLib.fromOutputScript(out.script, network)
    } catch (e) {
      // Unable to parse address (e.g., OP_RETURN)
      address = ''
    }

    outputs.push({
      address,
      satoshis: out.value,
      script: out.script.toString('hex'),
    })
  }

  return outputs
}

/**
 * Estimate transaction fee
 * @param inputCount Number of inputs
 * @param outputCount Number of outputs
 * @param feeRate Fee rate in sat/KB
 */
function estimateFee(inputCount: number, outputCount: number, feeRate: number): number {
  const txSize = TX_OVERHEAD + inputCount * INPUT_SIZE + outputCount * OUTPUT_SIZE
  // feeRate is sat/KB, convert to sat/byte by dividing by 1000
  const feeRatePerByte = feeRate / 1000
  return Math.ceil(txSize * feeRatePerByte)
}

/**
 * Select UTXOs to cover the target amount
 */
function selectUtxos(
  availableUtxos: Array<{ txId: string; outputIndex: number; satoshis: number; address: string; rawTx?: string }>,
  targetAmount: number,
  feeRate: number,
  outputCount: number
): {
  selectedUtxos: typeof availableUtxos
  fee: number
  totalInput: number
} {
  const selectedUtxos: typeof availableUtxos = []
  let totalInput = 0

  // Sort by value (largest first for efficiency)
  const sortedUtxos = [...availableUtxos].sort((a, b) => b.satoshis - a.satoshis)

  for (const utxo of sortedUtxos) {
    selectedUtxos.push(utxo)
    totalInput += utxo.satoshis

    const fee = estimateFee(selectedUtxos.length, outputCount, feeRate)

    if (totalInput >= targetAmount + fee) {
      return { selectedUtxos, fee, totalInput }
    }
  }

  throw new Error(`Insufficient funds: need ${targetAmount}, have ${totalInput}`)
}

/**
 * Complete a partial transaction by adding inputs and change output
 *
 * @param params.txHex - Partial transaction hex containing only outputs
 * @param params.feeRate - Fee rate in sat/KB
 * @param params.options.noBroadcast - If true, return raw tx without broadcasting
 * @param params.options.changeAddress - Custom change address (defaults to wallet address)
 */
export async function process(params: CompleteTxParams): Promise<CompleteTxResult> {
  const { txHex, feeRate, options } = params

  const netType = await getNetwork()
  const network = getDogeNetwork(netType)
  const wallet = await getDogeWallet()
  const walletAddress = wallet.getAddress()
  const changeAddress = options?.changeAddress || walletAddress

  // 1. Parse outputs from txHex
  const parsedOutputs = parseOutputsFromTxHex(txHex, network)

  if (parsedOutputs.length === 0) {
    throw new Error('No outputs found in transaction')
  }

  // 2. Calculate total output amount
  const totalOutput = parsedOutputs.reduce((sum, out) => sum + out.satoshis, 0)

  // 3. Fetch available UTXOs
  const availableUtxos = await fetchDogeUtxos(walletAddress, true) // true = include rawTx

  if (!availableUtxos.length) {
    throw new Error('No UTXOs available')
  }

  // 4. Select UTXOs (initially estimate with +1 output for change)
  const { selectedUtxos, fee, totalInput } = selectUtxos(
    availableUtxos,
    totalOutput,
    feeRate,
    parsedOutputs.length + 1 // +1 for potential change output
  )

  // 5. Build the transaction
  const psbt = new Psbt({ network })

  // Add inputs
  for (const utxo of selectedUtxos) {
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

  // Add original outputs
  for (const output of parsedOutputs) {
    if (output.address) {
      psbt.addOutput({
        address: output.address,
        value: output.satoshis,
      })
    } else {
      // OP_RETURN or other non-address outputs
      psbt.addOutput({
        script: Buffer.from(output.script, 'hex'),
        value: output.satoshis,
      })
    }
  }

  // Calculate and add change output
  const change = totalInput - totalOutput - fee
  if (change > DUST_LIMIT) {
    psbt.addOutput({
      address: changeAddress,
      value: change,
    })
  }

  // 6. Sign all inputs
  const signer = wallet.getSigner()
  psbt.signAllInputs(signer)
  psbt.finalizeAllInputs()

  // 7. Extract transaction
  const signedTx = psbt.extractTransaction(true) // true = skip fee rate check for DOGE
  const rawTx = signedTx.toHex()
  const txId = signedTx.getId()

  // Calculate actual fee
  const actualFee = totalInput - signedTx.outs.reduce((sum, out) => sum + out.value, 0)

  const result: CompleteTxResult = {
    txId,
    rawTx,
    fee: actualFee,
    inputs: selectedUtxos.map((utxo) => ({
      txId: utxo.txId,
      outputIndex: utxo.outputIndex,
      address: utxo.address,
      satoshis: utxo.satoshis,
    })),
    outputs: signedTx.outs.map((out, index) => {
      let address = ''
      try {
        const { address: addressLib } = require('bitcoinjs-lib')
        address = addressLib.fromOutputScript(out.script, network)
      } catch (e) {
        address = ''
      }
      return {
        address,
        satoshis: out.value,
      }
    }),
  }

  // Broadcast if not disabled
  if (!options?.noBroadcast) {
    await broadcastDogeTx(rawTx)
  }

  return result
}

/**
 * Estimate the transaction details without signing
 * Used for showing confirmation dialog
 */
export async function estimate(params: { txHex: string; feeRate: number }): Promise<{
  outputs: Array<{ address: string; satoshis: number }>
  estimatedInputCount: number
  estimatedFee: number
  totalOutput: number
  totalInput: number
  change: number
}> {
  const { txHex, feeRate } = params

  const netType = await getNetwork()
  const network = getDogeNetwork(netType)
  const wallet = await getDogeWallet()
  const walletAddress = wallet.getAddress()

  // Parse outputs
  const parsedOutputs = parseOutputsFromTxHex(txHex, network)
  const totalOutput = parsedOutputs.reduce((sum, out) => sum + out.satoshis, 0)

  // Fetch UTXOs
  const availableUtxos = await fetchDogeUtxos(walletAddress, true)

  // Select UTXOs
  const { selectedUtxos, fee, totalInput } = selectUtxos(
    availableUtxos,
    totalOutput,
    feeRate,
    parsedOutputs.length + 1
  )

  const change = totalInput - totalOutput - fee

  return {
    outputs: parsedOutputs.map((o) => ({ address: o.address, satoshis: o.satoshis })),
    estimatedInputCount: selectedUtxos.length,
    estimatedFee: fee,
    totalOutput,
    totalInput,
    change: change > DUST_LIMIT ? change : 0,
  }
}
