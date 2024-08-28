import Decimal from 'decimal.js'
import { getBtcNetwork } from '../network'
import { type UTXO } from '@/queries/utxos'
import { getCurrentWallet } from '../wallet'
import { createPayment } from '../bip32-deriver'
import { Account, getAddressType } from '@/lib/account'
import { Payment, Psbt, Transaction } from 'bitcoinjs-lib'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import { fetchBtcTxHex, broadcastBTCTx } from '@/queries/transaction'

// TODO: add safe utxo

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

  const buildPsbt = async (utxos: UTXO[]) => {
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
        .minus(68971 * 2)
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

  let psbt = await buildPsbt(utxos)

  psbt = await buildPsbt(utxos)
  console.log('virtualSize', psbt.extractTransaction().virtualSize())

  console.log(Math.floor(new Decimal(68971 * 2).div(psbt.extractTransaction().virtualSize()).toNumber()))

  // return { txId: psbt.extractTransaction().getId() }

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

  // return await this.broadcast(psbt)
}
