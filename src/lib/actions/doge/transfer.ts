/**
 * DOGE Transfer Action
 */

import Decimal from 'decimal.js'
import { getDogeWallet } from './wallet'
import { fetchDogeUtxos } from '@/queries/doge/utxos'
import { broadcastDogeTx, getDefaultDogeFeeRates, type DogeFeeRate } from '@/queries/doge/transaction'

interface DogeTransferParams {
  toAddress: string
  satoshis: string | number
  options?: {
    noBroadcast?: boolean
    feeRate?: string | number
  }
}

// Minimum transfer amount: 0.01 DOGE = 1,000,000 satoshis
const MIN_TRANSFER_SATOSHIS = 1000000

export async function process(
  params: DogeTransferParams
): Promise<{ txId: string } | { txHex: string }> {
  const wallet = await getDogeWallet()
  const address = wallet.getAddress()

  // Check minimum transfer amount
  const transferAmount = new Decimal(params.satoshis)
  if (transferAmount.lt(MIN_TRANSFER_SATOSHIS)) {
    throw new Error(`Minimum transfer amount is 0.01 DOGE (${MIN_TRANSFER_SATOSHIS} satoshis)`)
  }

  // Get fee rate
  let feeRate = params.options?.feeRate

  if (!feeRate) {
    const rates: DogeFeeRate[] = getDefaultDogeFeeRates()
    const avgRate = rates.find((item) => item.title === 'Avg')
    feeRate = avgRate?.feeRate || 200000 // Default to 0.002 DOGE/KB
  }

  feeRate = Number(feeRate)

  // Fetch UTXOs with raw transaction data (needed for P2PKH signing)
  const utxos = await fetchDogeUtxos(address, true)

  if (!utxos.length) {
    throw new Error('No UTXOs available')
  }

  // Sign the transaction
  const { txId, rawTx, fee } = await wallet.signTransaction({
    utxos,
    outputs: [
      {
        address: params.toAddress,
        satoshis: new Decimal(params.satoshis).toNumber(),
      },
    ],
    feeRate,
    changeAddress: address,
  })

  // Return raw hex if noBroadcast is set
  if (params.options?.noBroadcast) {
    return { txHex: rawTx }
  }

  // Broadcast the transaction
  const broadcastTxId = await broadcastDogeTx(rawTx)
  
  return { txId: broadcastTxId }
}
