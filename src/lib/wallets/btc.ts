import Decimal from 'decimal.js'
import { raise } from '../helpers'
import { getBtcNetwork } from '../network'
import { getXOnlyPublicKey } from '../btc-util'
import { createPayment } from '../bip32-deriver'
import { Chain, ScriptType } from '@metalet/utxo-wallet-service'
import { getBtcUtxos, type UTXO } from '@/queries/utxos'
import { Payment, Psbt, Transaction } from 'bitcoinjs-lib'
import { fetchBtcTxHex, broadcastBTCTx } from '@/queries/transaction'
import { Account, getCurrentAccount, getAddressType, getAddress, getSigner } from '@/lib/account'
import { getCurrentWallet } from '../wallet'

export class BtcWallet {
  private account?: Account = undefined

  constructor() {}

  static async create() {
    const wallet = new BtcWallet()

    wallet.account = (await getCurrentAccount()) ?? raise('No account found')

    return wallet
  }

  async merge(feeRate: number) {
    const wallet = await getCurrentWallet(Chain.BTC)
    const btcNetwork = await getBtcNetwork()
    const address = wallet.getAddress()
    const addressType = await getAddressType('btc')
    const payment = await createPayment(addressType)
    const utxos = (await getBtcUtxos(address, wallet.getScriptType() === ScriptType.P2PKH)) || []

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

      const signer = await getSigner(Chain.BTC)
      psbt.signAllInputs(signer).finalizeAllInputs()
      return psbt
    }

    let total = getTotalSatoshi(utxos)

    let psbt = await buildPsbt(utxos, total.minus(546))

    let fee = calculateFee(psbt, feeRate)

    psbt = await buildPsbt(utxos, total.minus(fee))

    return await this.broadcast(psbt)
  }

  async broadcast(psbt: Psbt) {
    const tx = psbt.extractTransaction()

    const rawTx = tx.toHex()

    const txId = await broadcastBTCTx(rawTx)
    return { txId }
  }
}

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
    payInput['tapInternalKey'] = await getXOnlyPublicKey()
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
