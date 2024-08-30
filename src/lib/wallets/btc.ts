import Decimal from 'decimal.js'
import { getBtcNetwork } from '../network'
import { type UTXO } from '@/queries/utxos'
import { getCurrentWallet } from '../wallet'
import { createPayment } from '../bip32-deriver'
import { Chain } from '@metalet/utxo-wallet-service'
import { Payment, Psbt, Transaction } from 'bitcoinjs-lib'
import { fetchBtcTxHex, broadcastBTCTx } from '@/queries/transaction'

function calculateFee(psbt: Psbt, feeRate: number): number {
  const tx = psbt.extractTransaction()

  const size = tx.virtualSize()

  return size * feeRate
}

function getTotalSatoshi(utxos: UTXO[]): Decimal {
  return utxos.reduce((total, utxo) => total.add(utxo.satoshis), new Decimal(0))
}

async function createPayInput({
  utxo,
  addressType,
  payment,
}: {
  payment: Payment
  utxo: UTXO
  addressType: string
}): Promise<any> {
  const payInput: any = {
    hash: utxo.txId,
    index: utxo.outputIndex,
  }

  if (['P2SH-P2WPKH', 'P2WPKH'].includes(addressType)) {
    payInput['witnessUtxo'] = {
      script: payment.output,
      value: utxo.satoshis,
    }
  }

  if (['P2TR'].includes(addressType)) {
    const wallet = await getCurrentWallet(Chain.BTC)
    payInput['tapInternalKey'] = wallet.getPublicKey().subarray(1)
    payInput['witnessUtxo'] = { value: utxo.satoshis, script: payment.output }
  }

  if (['P2PKH'].includes(addressType)) {
    const rawTx = await fetchBtcTxHex(utxo.txId)
    const tx = Transaction.fromHex(rawTx)
    payInput['nonWitnessUtxo'] = tx.toBuffer()
  }

  if (['P2SH-P2WPKH'].includes(addressType)) {
    payInput['redeemScript'] = payment.redeem?.output
  }

  return payInput
}

export const split = async (feeRate: number, utxos: UTXO[]) => {
  const wallet = await getCurrentWallet(Chain.BTC)
  const btcNetwork = await getBtcNetwork()
  const address = wallet.getAddress()
  const addressType = wallet.getScriptType()
  const payment = await createPayment(addressType)

  const buildPsbt = async (utxos: UTXO[], fee: number) => {
    const psbt = new Psbt({ network: btcNetwork })
    let total = getTotalSatoshi(utxos)

    for (let i = 0; i < 1600; i++) {
      psbt.addOutput({
        value: 1999,
        address: address,
      })
    }

    psbt.addOutput({
      value: total
        .minus(1999 * 1600)
        .minus(fee)
        .toNumber(),
      address: address,
    })

    for (const utxo of utxos) {
      try {
        const payInput = await createPayInput({ utxo, payment, addressType })
        psbt.addInput(payInput)
      } catch (e: any) {
        throw new Error(e.message)
      }
    }

    const signer = wallet.getSigner()
    psbt.signAllInputs(signer).finalizeAllInputs()
    return psbt
  }

  let total = getTotalSatoshi(utxos)

  let psbt = await buildPsbt(utxos, 0)

  psbt = await buildPsbt(utxos, Math.ceil(psbt.extractTransaction().virtualSize() * feeRate))

  const txId = await broadcastBTCTx(psbt.extractTransaction().toHex())
  return { txId }
}

export const merge = async (feeRate: number, utxos: UTXO[]) => {
  console.log('start merge')

  const wallet = await getCurrentWallet(Chain.BTC)
  const btcNetwork = await getBtcNetwork()
  const address = wallet.getAddress()
  const addressType = wallet.getScriptType()
  const payment = await createPayment(addressType)

  const buildPsbt = async (utxos: UTXO[], amount: Decimal) => {
    const psbt = new Psbt({ network: btcNetwork }).addOutput({
      value: amount.toNumber(),
      address: address,
    })

    for (const utxo of utxos) {
      try {
        const payInput = await createPayInput({ utxo, payment, addressType })
        psbt.addInput(payInput)
      } catch (e: any) {
        throw new Error(e.message)
      }
    }

    const signer = wallet.getSigner()
    psbt.signAllInputs(signer).finalizeAllInputs()
    return psbt
  }

  let total = getTotalSatoshi(utxos)

  let psbt = await buildPsbt(utxos, total.minus(546))

  let fee = calculateFee(psbt, feeRate)

  psbt = await buildPsbt(utxos, total.minus(fee))

  return { txId: psbt.extractTransaction().getId(), total, fee, rawTx: psbt.extractTransaction().toHex() }
}
